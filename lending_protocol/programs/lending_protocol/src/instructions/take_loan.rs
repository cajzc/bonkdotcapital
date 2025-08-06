use crate::{
    errors::Errors,
    state::{loan::{OpenLoan, LoanInfo}, collateral::CollateralVault},
};
use anchor_lang::prelude::*;
use anchor_spl::{
    token::Transfer,
    token_interface::{Mint, TokenAccount, TokenInterface},
    associated_token::AssociatedToken
};
use std::str::FromStr;


pub fn take_loan(ctx: Context<TakeLoan>) -> Result<()> {
    // The loaner wants sol as collateral
    if ctx.accounts.loan_info.collateral_token_mint.key() == Pubkey::from_str("So11111111111111111111111111111111111111112").unwrap() {
        require!(
            ctx.accounts.borrower.lamports() >= ctx.accounts.loan_info.collateral_amount,
            Errors::CollateralNotEnough
        );
    } else {
        // The loaner wants tokens as collateral
        require!(
            ctx.accounts.borrower_token_account.amount >= ctx.accounts.loan_info.collateral_amount,
            Errors::CollateralNotEnough
        );
        require!(
            ctx.accounts.token_mint.key() == ctx.accounts.loan_info.collateral_token_mint.key(),
            Errors::InvalidCollateralToken
        );
    }
    require!(!ctx.accounts.loan_info.is_active, Errors::OfferNotActive);
    // FIXME: always passes
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp <= ctx.accounts.loan_info.duration_seconds as i64 + clock.unix_timestamp,
        Errors::LoanOfferExpired
    );
    require!(
      !ctx.accounts.loan_info.is_active,
      Errors::LoanAlreadyExists
    );

    // Update loan info
    let loan_info = &mut ctx.accounts.loan_info;
    loan_info.is_active = true;

    // Open the loan
    let open_loan = &mut ctx.accounts.open_loan;
    open_loan.loan_info = ctx.accounts.loan_info.key();
    open_loan.borrower = ctx.accounts.borrower.key();
    open_loan.principal = ctx.accounts.loan_info.loan_amount;
    open_loan.start_time = ctx.accounts.clock.unix_timestamp;
    // FIXME: Casting
    open_loan.repay_by_time = ctx.accounts.clock.unix_timestamp + ctx.accounts.loan_info.duration_seconds as i64;
    open_loan.is_repaid = false;
    open_loan.bump = ctx.bumps.open_loan;

    // Deposit the collateral

    // The loaner wants sol as collateral
    if ctx.accounts.loan_info.collateral_token_mint.key() == Pubkey::from_str("So11111111111111111111111111111111111111112").unwrap() {
        let ix = solana_program::system_instruction::transfer(
            &ctx.accounts.borrower.key(),
            &ctx.accounts.collateral_vault.key(),
            ctx.accounts.loan_info.collateral_amount,
        );
        solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.borrower.to_account_info(),
                ctx.accounts.collateral_vault.to_account_info(),
            ],
        )?;
    } else {
        // The loaner wants tokens as collateral
        let cpi_accounts = Transfer {
            from: ctx.accounts.borrower_token_account.to_account_info(),
            to: ctx.accounts.collateral_vault.to_account_info(),
            authority: ctx.accounts.borrower.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        anchor_spl::token::transfer(cpi_ctx, ctx.accounts.loan_info.collateral_amount)?;
    }

    // Create the collateral vault
    let collateral_vault = &mut ctx.accounts.collateral_vault;
    collateral_vault.borrower = ctx.accounts.borrower.key();
    collateral_vault.token_mint= ctx.accounts.token_mint.key();
    collateral_vault.loan_info = ctx.accounts.loan_info.key();
    collateral_vault.amount = ctx.accounts.loan_info.collateral_amount;
    collateral_vault.is_active = true;
    collateral_vault.bump = ctx.bumps.collateral_vault;

    msg!(
        "Borrower {} deposited {} {} tokens as collateral",
        collateral_vault.borrower,
        collateral_vault.amount,
        collateral_vault.token_mint
    );

    // Transfer loan amount from vault to borrower
    let lender = ctx.accounts.lender.key();
    let token_mint = ctx.accounts.token_mint.key();
    let seeds = &[
        b"loan_info",
        lender.as_ref(),
        token_mint.as_ref(),
        &[ctx.bumps.loan_info]
    ];
    let signer = &[&seeds[..]];
    let cpi_accounts = Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.borrower_token_account.to_account_info(),
        authority: ctx.accounts.loan_info.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    anchor_spl::token::transfer(cpi_ctx, ctx.accounts.loan_info.loan_amount)?;

    msg!(
        "Loan taken: Borrower {} received {} from offer {}",
        ctx.accounts.borrower.key(),
        ctx.accounts.loan_info.loan_amount,
        ctx.accounts.loan_info.key()
    );

    Ok(())
}

#[derive(Accounts)]
pub struct TakeLoan<'info> {
    #[account(
        init,
        payer = borrower,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 1 + 1,
        seeds = [b"open_loan", loan_info.key().as_ref(), borrower.key().as_ref()],
        bump
    )]
    /// State of the loan taken by a borrower
    pub open_loan: Account<'info, OpenLoan>,

    #[account(
        init,
        payer = borrower,
        space = 8 + 32 + 32 + 32 + 8 + 1 + 1,
        seeds = [b"collateral_vault", loan_info.key().as_ref(), borrower.key().as_ref()],
        bump,
    )]
    /// Stores the collateral token and metadata
    pub collateral_vault: Account<'info, CollateralVault>,

    #[account(
        init_if_needed,
        payer = borrower,
        associated_token::mint = token_mint,
        associated_token::authority = borrower,
        associated_token::token_program = token_program,
    )]
    pub borrower_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = loan_info.loan_token_mint,
        token::authority = loan_info,
        seeds = [b"vault", loan_info.key().as_ref()],
        bump
    )]
    /// Holds the tokens sent out for a loan prior to a second party borrowing
    pub vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"loan_info", lender.key().as_ref(), token_mint.key().as_ref()],
        bump
    )]
    /// Stores metadata about the loan info
    pub loan_info: Account<'info, LoanInfo>,

    #[account(mut)]
    pub borrower: Signer<'info>,

    #[account(constraint = loan_info.lender == lender.key())]
    /// CHECK: lender is only used for loan info pda derivation
    pub lender: AccountInfo<'info>,
    pub token_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}
