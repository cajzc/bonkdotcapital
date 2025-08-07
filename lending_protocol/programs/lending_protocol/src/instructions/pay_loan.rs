use anchor_lang::context::{Context, CpiContext};
use anchor_lang::prelude::*;
use anchor_lang::{require, Accounts, Key, ToAccountInfo};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Transfer;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use crate::errors::Errors;
use crate::state::collateral::CollateralVault;
use crate::state::loan::{LoanInfo, OpenLoan};

pub fn pay_loan(ctx:Context<PayLoan>) -> anchor_lang::Result<()> {
    msg!("invoked");
    // // Ensure loan isn't already repaid
    // require!(!ctx.accounts.open_loan.is_repaid, Errors::LoanAlreadyRepaid);
    //
    // // FIXME:
    // const SECONDS_PER_YEAR: u64 = 31_536_000;
    //
    // let clock = Clock::get()?;
    //
    // // Calculate time elapsed in seconds
    // // FIXME: casting
    // let time_elapsed = (clock.unix_timestamp - ctx.accounts.open_loan.start_time) as u64;
    // let duration_seconds = (ctx.accounts.open_loan.repay_by_time - ctx.accounts.open_loan.start_time) as u64;
    // let effective_time = time_elapsed.min(duration_seconds);
    //
    //
    // //Calculate interest using u128 to avoid overflow
    // let principal = ctx.accounts.open_loan.principal as u128;
    // let interest_rate_bps = ctx.accounts.loan_info.interest_rate_bps as u128;
    // let effective_time = effective_time as u128;
    // let denominator = (SECONDS_PER_YEAR as u128) * 10_000 as u128;
    // let interest = (principal * interest_rate_bps * effective_time) / denominator;
    // let interest = interest as u64;
    //
    // // Total repayment amount
    // let total_amount = ctx.accounts.open_loan.principal.checked_add(interest).ok_or(Errors::MathOverflow)?;
    //
    // // Transfer principal + interest from borrower to lender
    // let cpi_accounts = Transfer {
    //     from: ctx.accounts.borrower_token_account.to_account_info(),
    //     to: ctx.accounts.lender_token_account.to_account_info(),
    //     authority: ctx.accounts.borrower.to_account_info(),
    // };
    // let cpi_program = ctx.accounts.token_program.to_account_info();
    // let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    // anchor_spl::token::transfer(cpi_ctx, total_amount)?;
    //
    // // Mark loan as repaid
    // let open_loan = &mut ctx.accounts.open_loan;
    // let loan_info= &mut ctx.accounts.loan_info;
    // let collateral_vault = &mut ctx.accounts.collateral_vault;
    // open_loan.is_repaid = true;
    // loan_info.is_active = false;
    //
    // //Return collateral to the borrower
    // let loan_info_key = ctx.accounts.loan_info.key();
    // let borrower_key = ctx.accounts.borrower.key();
    //
    // let amount_to_return = collateral_vault.amount;
    // if amount_to_return > 0 {
    //     let seeds = &[
    //         b"collateral_vault",
    //         loan_info_key.as_ref(),
    //         borrower_key.as_ref(),
    //         &[ctx.bumps.collateral_vault],
    //     ];
    //     let signer = &[&seeds[..]];
    //     let cpi_accounts = Transfer {
    //         from: ctx.accounts.collateral_vault.to_account_info(),
    //         to: ctx.accounts.borrower_token_account.to_account_info(),
    //         authority: ctx.accounts.collateral_vault.to_account_info(),
    //     };
    //     let cpi_program = ctx.accounts.token_program.to_account_info();
    //     let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    //
    //     anchor_spl::token::transfer(cpi_ctx, amount_to_return)?;
    //     msg!("Returned {} collateral to borrower", amount_to_return);
    // }
    //
    // msg!(
    //     "Loan repaid: Borrower {} paid {} (principal: {}, interest: {}) to lender {}",
    //     ctx.accounts.borrower.key(),
    //     total_amount,
    //     ctx.accounts.open_loan.principal,
    //     interest,
    //     ctx.accounts.loan_info.lender
    // );

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
        seeds = [b"loan_info", lender.key().as_ref(), loaned_token_mint.key().as_ref()],
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

    #[account(mut)]
    /// CHECK: Can be set to dummy address if collateral is SOL.
    /// Collateral tokens stored
    pub collateral_vault_token_account: AccountInfo<'info>,

    /// CHECK: Can be set to dummy address if collateral is SOL.
    /// Token mint used as collateral
    pub collateral_token_mint: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: Can be set to dummy address if collateral is SOL.
    /// Borrower receives collateral to this account
    pub borrower_collateral_token_account: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: Can be set to dummy address if loaned token is SOL.
    /// Lender receives their loaned tokens back
    pub lender_token_account: AccountInfo<'info>,

    /// CHECK: Can be set to dummy address if loaned token is SOL.
    /// Token mint loaned
    pub loaned_token_mint: AccountInfo<'info>,

    #[account(mut)]
    pub borrower: Signer<'info>,

    #[account(constraint = loan_info.lender == lender.key())]
    /// CHECK: lender is only used for loan info pda derivation
    pub lender: AccountInfo<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
