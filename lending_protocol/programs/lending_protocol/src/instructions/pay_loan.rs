use anchor_lang::context::{Context, CpiContext};
use anchor_lang::prelude::*;
use anchor_lang::{require, Accounts, Key, ToAccountInfo};
use anchor_spl::token::Transfer;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::errors::Errors;
use crate::state::collateral::CollateralVault;
use crate::state::loan::{LoanInfo, OpenLoan};
use std::str::FromStr;
use anchor_spl::associated_token::AssociatedToken;

pub fn pay_loan(ctx:Context<PayLoan>) -> Result<()> {
    // Ensure loan isn't already repaid
    require!(!ctx.accounts.open_loan.is_repaid, Errors::LoanAlreadyRepaid);
    
    // TODO: liquidation

    // FIXME:
    const SECONDS_PER_YEAR: u64 = 31_536_000;

    let clock = Clock::get()?;

    // Calculate time elapsed in seconds
    // FIXME: casting
    let time_elapsed = (clock.unix_timestamp - ctx.accounts.open_loan.start_time) as u64;
    let duration_seconds = (ctx.accounts.open_loan.repay_by_time - ctx.accounts.open_loan.start_time) as u64;
    let effective_time = time_elapsed.min(duration_seconds);

    //Calculate interest using u128 to avoid overflow
    let principal = ctx.accounts.open_loan.principal as u128;
    let interest_rate_bps = ctx.accounts.loan_info.interest_rate_bps as u128;
    let effective_time = effective_time as u128;
    let denominator = (SECONDS_PER_YEAR as u128) * 10_000 as u128;
    let interest = ((principal * interest_rate_bps * effective_time) / denominator) as u64;

    // Total repayment amount
    let total_amount = ctx.accounts.open_loan.principal.checked_add(interest).ok_or(Errors::MathOverflow)?;
    
    let loan_info_key = ctx.accounts.loan_info.key();
    let borrower_key = ctx.accounts.borrower.key();
    let seeds = &[
        b"collateral_vault",
        loan_info_key.as_ref(),
        borrower_key.as_ref(),
        &[ctx.bumps.collateral_vault],
    ];
    let signer = &[&seeds[..]];

    if ctx.accounts.loan_info.collateral_token_mint.key() == Pubkey::from_str("So11111111111111111111111111111111111111112").unwrap() {
        // Return the Solana collateral 
        let ix = solana_program::system_instruction::transfer(
            &ctx.accounts.collateral_vault.key(),
            &ctx.accounts.borrower.key(),
            ctx.accounts.loan_info.collateral_amount,
        );
        solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.collateral_vault.to_account_info(),
                ctx.accounts.borrower.to_account_info(),
            ],
        )?;
        
        // Pay the interest
        let ix = solana_program::system_instruction::transfer(
            &ctx.accounts.borrower.key(),
            &ctx.accounts.lender.key(),
            total_amount,
        );
        solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.borrower.to_account_info(),
                ctx.accounts.lender.to_account_info(),
            ],
        )?;
    } else {
        let Some(collateral_vault_token_account) = ctx.accounts.collateral_vault_token_account.as_ref() else {
            return Err(Errors::MissingCollateralVaultTokenAccount.into());
        };
        let Some(borrower_token_account) = ctx.accounts.borrower_token_account.as_ref() else {
            return Err(Errors::MissingBorrowerTokenAccount.into());
        };
        // Return the token collateral 
        let cpi_accounts = Transfer {
            from: collateral_vault_token_account.to_account_info(),
            to: borrower_token_account.to_account_info(),
            authority: ctx.accounts.collateral_vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        anchor_spl::token::transfer(cpi_ctx, ctx.accounts.loan_info.collateral_amount)?;

        // Transfer principal + interest from borrower to lender
        let cpi_accounts = Transfer {
            from: borrower_token_account.to_account_info(),
            to: ctx.accounts.lender_token_account.to_account_info(),
            authority: ctx.accounts.borrower.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        anchor_spl::token::transfer(cpi_ctx, total_amount)?;
    }

    // Mark loan as repaid
    let open_loan = &mut ctx.accounts.open_loan;
    let loan_info= &mut ctx.accounts.loan_info;
    let collateral_vault = &mut ctx.accounts.collateral_vault;
    open_loan.is_repaid = true;
    loan_info.is_active = false;

    msg!(
        "Loan repaid: Borrower {} paid {} (principal: {}, interest: {}) to lender {}",
        ctx.accounts.borrower.key(),
        total_amount,
        ctx.accounts.open_loan.principal,
        interest,
        ctx.accounts.loan_info.lender
    );

    Ok(())
}


#[derive(Accounts)]
pub struct PayLoan<'info>{
    #[account(
        mut,
        seeds = [b"open_loan", loan_info.key().as_ref(), borrower.key().as_ref()],
        bump
    )]
    /// State of the loan taken by a borrower
    pub open_loan: Account<'info, OpenLoan>,

    #[account(
        mut,
        seeds = [b"loan_info", lender.key().as_ref(), token_mint.key().as_ref()],
        bump
    )]
    /// Stores metadata about the loan info
    pub loan_info: Account<'info, LoanInfo>,

    #[account(
        mut,
        seeds = [b"collateral_vault", loan_info.key().as_ref(), borrower.key().as_ref()],
        bump,
    )]
    /// Stores the collateral token and metadata
    pub collateral_vault: Account<'info, CollateralVault>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = collateral_vault,
        associated_token::token_program = token_program,
    )]
    pub collateral_vault_token_account: Option<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = borrower,
        associated_token::mint = token_mint,
        associated_token::authority = borrower,
        associated_token::token_program = token_program,
    )]
    pub borrower_token_account: Option<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = token_mint,
        token::authority = loan_info.lender,
    )]
    pub lender_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub borrower: Signer<'info>,

    #[account(constraint = loan_info.lender == lender.key())]
    /// CHECK: lender is only used for loan info pda derivation
    pub lender: AccountInfo<'info>,

    pub token_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

