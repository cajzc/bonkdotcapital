use crate::{
    error::Errors,
    state::{borrower_profile::BorrowerProfile, loan::Loan, loan_offer::LoanOffer},
};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

pub fn accept_loan(ctx: Context<AcceptLoan>, bump: u8) -> Result<()> {
    let loan_offer = &mut ctx.accounts.loan_offer;
    let borrower_profile = &ctx.accounts.borrower_profile;
    let loan = &mut ctx.accounts.loan;
    let clock = Clock::get()?;

    require!(loan_offer.is_active, Errors::OfferNotActive);
    require!(
        borrower_profile.score >= loan_offer.min_score,
        Errors::InsufficientScore
    );
    require!(
        clock.slot <= loan_offer.duration_slots + clock.slot, // Simplified expiration check
        Errors::LoanOfferExpired
    );

    // Calculate interest owed
    let interest_owed = (loan_offer.amount * loan_offer.interest_rate_bps as u64) / 10_000;

    //Initialize Loan Account
    loan.offer = loan_offer.key();
    loan.borrower = ctx.accounts.borrower.key();
    loan.principal = loan_offer.amount;
    loan.start_slot = clock.slot;
    loan.repay_by_slot = clock.slot + loan_offer.duration_slots;
    loan.interest_owed = interest_owed;
    loan.is_repaid = false;
    loan.bump = bump;

    //Transfer loan amount from vault to borrower
    let seeds = &[
        b"loan_offer",
        loan_offer.lender.as_ref(),
        loan_offer.token_mint.as_ref(),
        &[loan_offer.bump],
    ];
    let signer = &[&seeds[..]];
    let cpi_accounts = Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.borrower_token_account.to_account_info(),
        authority: loan_offer.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token::transfer(cpi_ctx, loan_offer.amount)?;

    //Mark loan offer as inactive
    loan_offer.is_active = false;

    msg!(
        "Loan accepted: Borrower {} received {} from offer {}",
        ctx.accounts.borrower.key(),
        loan_offer.amount,
        loan_offer.key()
    );
    Ok(())
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct AcceptLoan<'info> {
    #[account(
        mut,
        seeds = [b"loan_offer", loan_offer.lender.as_ref(), token_mint.key().as_ref()],
        bump = loan_offer.bump,
        has_one = token_mint,
        has_one = vault
    )]
    pub loan_offer: Account<'info, LoanOffer>,

    #[account(
        init,
        payer = borrower,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 1, // Discriminator + Loan fields
        seeds = [b"loan", loan_offer.key().as_ref(), borrower.key().as_ref()],
        bump
    )]
    pub loan: Account<'info, Loan>,

    #[account(
        seeds = [b"borrower_profile", borrower.key().as_ref()],
        bump = borrower_profile.bump
    )]
    pub borrower_profile: Account<'info, BorrowerProfile>,

    #[account(
        mut,
        token::mint = token_mint,
        token::authority = borrower
    )]
    pub borrower_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = token_mint,
        token::authority = loan_offer
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub borrower: Signer<'info>,

    pub token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}
