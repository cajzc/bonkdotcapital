use crate::{
    errors::Errors,
    state::loan::LoanInfo
};
use anchor_lang::prelude::*;
use anchor_spl::{
    token::Transfer,
    token_interface::{Mint, TokenAccount, TokenInterface},
    associated_token::AssociatedToken
};

pub fn create_loan(
    ctx: Context<CreateLoan>,
    amount: u64,
    interest_rate_bps: u16,
    duration_seconds: u64,
    min_score: u64,
) -> Result<()> {
    require!(amount > 0, Errors::InvalidAmount);
    require!(interest_rate_bps > 0, Errors::InvalidInterestRate);
    require!(duration_seconds > 0, Errors::InvalidDuration);
    require!(min_score <= 1000, Errors::InvalidScore);

    let loan_info= &mut ctx.accounts.loan_info;
    let lender = &ctx.accounts.lender;

    //Init loan offer account
    loan_info.lender = lender.key();
    loan_info.loan_token_mint = ctx.accounts.loan_token_mint.key();
    loan_info.accepted_token_mint = ctx.accounts.accepted_token_mint.key();
    loan_info.amount = amount;
    loan_info.interest_rate_bps = interest_rate_bps;
    loan_info.duration_seconds = duration_seconds;
    loan_info.min_score = min_score;
    loan_info.vault = ctx.accounts.vault.key();
    loan_info.is_active = true;
    loan_info.bump = ctx.bumps.loan_info;

    //Transfer loan to vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.lender_token_account.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
        authority: lender.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    anchor_spl::token::transfer(cpi_ctx, amount)?;

    msg!(
        "Loan offer created with amount: {} and interest rate: {} bps",
        amount,
        interest_rate_bps
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64, interest_rate_bps: u16, duration_slots: u64, min_score: u64)]
pub struct CreateLoan<'info> {
    #[account(
        init,
        payer = lender,
        space = 8 + 32 + 32 + 32 + 8 + 2 + 8 + 8 + 32 + 1 + 1,
        seeds = [b"loan_info", lender.key().as_ref(), loan_token_mint.key().as_ref()],
        bump
    )]
    /// Stores metadata about the loan info
    pub loan_info: Account<'info, LoanInfo>,

    #[account(
        init,
        payer = lender,
        token::mint = loan_token_mint,
        token::authority = loan_info, 
        seeds = [b"vault", loan_info.key().as_ref()],
        bump
    )]
    /// Holds the tokens sent out for a loan prior to a second party borrowing
    pub vault: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub lender: Signer<'info>,

    #[account(
       mut,
       token::mint = loan_token_mint,
       token::authority = lender
    )]
    pub lender_token_account: InterfaceAccount<'info, TokenAccount>,
    pub loan_token_mint: InterfaceAccount<'info, Mint>,
    pub accepted_token_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
