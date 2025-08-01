use crate::{
    errors::Errors,
    state::{borrower_profile::BorrowerProfile, loan::Loan, loan_offer::LoanOffer},
};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

pub fn repay_loan(ctx: Context<RepayLoan>, repayment_amount: u64) -> Result<()> {
    let loan = &mut ctx.accounts.loan;
    let borrower = &ctx.accounts.borrower;
    let borrower_profile = &mut ctx.accounts.borrower_profile;
    let clock = Clock::get()?;

    require!(!loan.is_repaid, Errors::LoanAlreadyRepaid);
    require!(
        repayment_amount >= loan.principal + loan.interest_owed,
        Errors::InsufficientRepayment
    );
    require!(
        clock.slot <= loan.repay_by_slot,
        Errors::LoanRepaymentOverdue
    );

    let cpi_accounts = Transfer {
        from: ctx.accounts.borrower_token_account.to_account_info(),
        to: ctx.accounts.lender_token_account.to_account_info(),
        authority: borrower.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, loan.principal + loan.interest_owed)?;

    // Mark loan as repaid
    loan.is_repaid = true;

    borrower_profile.score = borrower_profile.score.saturating_add(50); // Example: +50 points
    borrower_profile.last_updated_slot = clock.slot;

    msg!(
        "Loan repaid: Borrower {} repaid {} (principal: {}, interest: {})",
        borrower.key(),
        loan.principal + loan.interest_owed,
        loan.principal,
        loan.interest_owed
    );
    Ok(())
}

#[derive(Accounts)]
pub struct RepayLoan<'info> {
    #[account(
        mut,
        seeds = [b"loan", loan_offer.key().as_ref(), borrower.key().as_ref()],
        bump = loan.bump,
        has_one = offer,
        has_one = borrower
    )]
    pub loan: Account<'info, Loan>,

    #[account(
        seeds = [b"loan_offer", loan_offer.lender.as_ref(), token_mint.key().as_ref()],
        bump = loan_offer.bump
    )]
    pub loan_offer: Account<'info, LoanOffer>,

    #[account(
        mut,
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
        token::authority = loan_offer.lender
    )]
    pub lender_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub borrower: Signer<'info>,

    pub token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}
