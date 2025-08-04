use crate::{errors::Errors, state::loan_offer::LoanOffer};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

pub fn create_loan(
    ctx: Context<CreateLoan>,
    amount: u64,
    interest_rate_bps: u16,
    duration_slots: u64,
    min_score: u64,
    bump: u8,
) -> Result<()> {
    //validate inputs
    require!(amount > 0, Errors::InvalidAmount);
    require!(interest_rate_bps > 0, Errors::InvalidInterestRate);
    require!(duration_slots > 0, Errors::InvalidDuration);
    require!(min_score <= 1000, Errors::InvalidScore);

    let loan_offer = &mut ctx.accounts.loan_offer;
    let lender = &ctx.accounts.lender;

    //Init loan offer account
    loan_offer.lender = lender.key();
    loan_offer.token_mint = ctx.accounts.token_mint.key();
    loan_offer.amount = amount;
    loan_offer.interest_rate_bps = interest_rate_bps;
    loan_offer.duration_slots = duration_slots;
    loan_offer.min_score = min_score;
    loan_offer.vault = ctx.accounts.vault.key();
    loan_offer.is_active = true;
    loan_offer.bump = bump;

    //Transfer loan to vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.lender_token_account.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
        authority: lender.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    msg!(
        "Loan offer created with amount: {} and interest rate: {} bps",
        amount,
        interest_rate_bps
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64, interest_rate_bps: u16, duration_slots: u64, min_score: u64, bump: u8)]
pub struct CreateLoan<'info> {
    #[account(
        init,
        payer = lender,
        space = 8 + 32 + 32 + 8 + 2 + 8 + 8 + 32 + 1 + 1, // Discriminator + LoanOffer fields
        seeds = [b"loan_offer", lender.key().as_ref(), token_mint.key().as_ref()],
        bump
    )]
    pub loan_offer: Account<'info, LoanOffer>,

    #[account(
        init,
        payer = lender,
        token::mint = token_mint,
        token::authority = loan_offer, // Vault is controlled by the LoanOffer PDA
        seeds = [b"vault", loan_offer.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub lender: Signer<'info>,

    #[account(
        mut,
        token::mint = token_mint,
        token::authority = lender
    )]
    pub lender_token_account: Account<'info, TokenAccount>,

    pub token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
