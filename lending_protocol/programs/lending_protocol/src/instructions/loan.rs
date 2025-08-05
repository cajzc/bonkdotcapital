use crate::{
    errors::Errors,
    state::{borrower_profile::BorrowerProfile, loan::{Loan, LoanOffer}, obligation::Obligation},
};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

pub fn create_loan(
    ctx: Context<CreateLoan>,
    amount: u64,
    interest_rate_bps: u16,
    duration_seconds: u64,
    min_score: u64,
    bump: u8,
) -> Result<()> {
    //validate inputs
    require!(amount > 0, Errors::InvalidAmount);
    require!(interest_rate_bps > 0, Errors::InvalidInterestRate);
    require!(duration_seconds > 0, Errors::InvalidDuration);
    require!(min_score <= 1000, Errors::InvalidScore);

    let loan_offer = &mut ctx.accounts.loan_offer;
    let lender = &ctx.accounts.lender;

    //Init loan offer account
    loan_offer.lender = lender.key();
    loan_offer.token_mint = ctx.accounts.token_mint.key();
    loan_offer.amount = amount;
    loan_offer.interest_rate_bps = interest_rate_bps;
    loan_offer.duration_seconds = duration_seconds;
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
        space = 8 + 32 + 32 + 8 + 2 + 8 + 8 + 32 + 1 + 1, 
        seeds = [b"loan_offer", lender.key().as_ref(), token_mint.key().as_ref()],
        bump
    )]
    pub loan_offer: Account<'info, LoanOffer>,
    #[account(
        init,
        payer = lender,
        token::mint = token_mint,
        token::authority = loan_offer, 
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


pub fn accept_loan(ctx: Context<AcceptLoan>, bump: u8) -> Result<()> {
    let loan_offer = &mut ctx.accounts.loan_offer;
    let loan = &mut ctx.accounts.loan;
    let clock = Clock::get()?;
    let obligation = &mut ctx.accounts.obligation;

    require!(loan_offer.is_active, Errors::OfferNotActive);
    // Removed borrower_profile score check
    require!(
        clock.unix_timestamp <= loan_offer.duration_seconds as i64 + clock.unix_timestamp,
        Errors::LoanOfferExpired
    );
    require!(
      !obligation.loan_active,
      Errors::LoanAlreadyExists
    );

    obligation.loan_active = true;

    // Initialize Loan Account
    loan.offer = loan_offer.key();
    loan.borrower = ctx.accounts.borrower.key();
    loan.principal = loan_offer.amount;
    loan.start_time = clock.unix_timestamp;
    loan.repay_by_time = clock.unix_timestamp + loan_offer.duration_seconds as i64;
    loan.is_repaid = false;
    loan.bump = bump;

    // Transfer loan amount from vault to borrower
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

    // Mark loan offer as inactive
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
        space = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 1,
        seeds = [b"loan", loan_offer.key().as_ref(), borrower.key().as_ref()],
        bump
    )]
    pub loan: Account<'info, Loan>,

    #[account(
        mut,
        seeds = [b"obligation", borrower.key.as_ref()],
        bump = obligation.bump,
        has_one = borrower
        )]
    pub obligation: Account<'info, Obligation>,

    // REMOVED borrower_profile field here

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

pub fn pay_loan(ctx:Context<PayLoan>) -> Result<()>{
    let loan = &mut ctx.accounts.loan;
    let clock = Clock::get()?;
    let obligation = &mut ctx.accounts.obligation;

    // Ensure loan isn't already repaid
    require!(!loan.is_repaid, Errors::LoanAlreadyRepaid);

    //Calculate time elapse in seconds
    let time_elapsed = (clock.unix_timestamp - loan.start_time) as u64;
    let duration_seconds = (loan.repay_by_time - loan.start_time) as u64;
    let effective_time = time_elapsed.min(duration_seconds);

    //Constants
    const SECONDS_PER_YEAR: u64 = 31_536_000;

    //Calculate interest using u128 to avoid overflow
    let principal = loan.principal as u128;
    let interest_rate_bps = ctx.accounts.loan_offer.interest_rate_bps as u128;
    let effective_time = effective_time as u128;
    let denominator = (SECONDS_PER_YEAR as u128) * 10_000 as u128;
    let interest = (principal * interest_rate_bps * effective_time) / denominator;
    let interest = interest as u64;

    // Total repayment amount
    let total_amount = loan.principal.checked_add(interest).ok_or(Errors::MathOverflow)?;

    // Transfer principal + interest from borrower to lender
    let cpi_accounts = Transfer {
        from: ctx.accounts.borrower_token_account.to_account_info(),
        to: ctx.accounts.lender_token_account.to_account_info(),
        authority: ctx.accounts.borrower.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, total_amount)?;

    // Mark loan as repaid
    loan.is_repaid = true;
    obligation.loan_active = false;

    //Return collateral to the borrower
    let amount_to_return = obligation.deposited_amount;

    if amount_to_return > 0 {
        let seeds = &[
          b"obligation",
          ctx.accounts.borrower.key.as_ref(),
         &[obligation.bump],
        ];

        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.collateral_vault.to_account_info(),
            to: ctx.accounts.borrower_token_account.to_account_info(),
            authority: obligation.to_account_info(),
        };
       let cpi_program = ctx.accounts.token_program.to_account_info();
       let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

       token::transfer(cpi_ctx, amount_to_return)?;
      msg!("Returned {} collateral to borrower", amount_to_return); 
    }

     msg!(
        "Loan repaid: Borrower {} paid {} (principal: {}, interest: {}) to lender {}",
        ctx.accounts.borrower.key(),
        total_amount,
        loan.principal,
        interest,
        ctx.accounts.loan_offer.lender
    );

    Ok(())
}


#[derive(Accounts)]
pub struct PayLoan<'info>{
    #[account(
        mut,
        seeds = [b"loan", loan_offer.key().as_ref(), borrower.key().as_ref()],
        bump = loan.bump,
        constraint = loan.offer == loan_offer.key(),
        has_one = borrower
    )]
    pub loan: Account<'info, Loan>,

    #[account(
        seeds = [b"loan_offer", loan_offer.lender.as_ref(), token_mint.key().as_ref()],
        bump = loan_offer.bump,
        has_one = token_mint,
    )]
    pub loan_offer: Account<'info, LoanOffer>,

    #[account(
        mut,
        seeds = [b"obligation", borrower.key().as_ref()],
        bump = obligation.bump,
        has_one = borrower
    )]
    pub obligation: Account<'info, Obligation>,

    #[account(
        mut,
        seeds = [b"collateral_vault", borrower.key().as_ref(), token_mint.key().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = obligation
    )]
    pub collateral_vault: Account<'info, TokenAccount>,

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

    pub clock: Sysvar<'info, Clock>,
}

