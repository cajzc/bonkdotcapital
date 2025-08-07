use anchor_lang::context::{Context, CpiContext};
use anchor_lang::prelude::*;
use anchor_lang::{require, Accounts, Key, ToAccountInfo};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Transfer;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use solana_program::program::invoke_signed;
use crate::errors::Errors;
use crate::state::collateral::CollateralVault;
use crate::state::loan::{LoanInfo, OpenLoan};

pub fn pay_loan(ctx: Context<PayLoan>) -> anchor_lang::Result<()> {
    use anchor_lang::solana_program::{program::invoke, system_instruction};
    use anchor_spl::token::{transfer, Transfer};

    require!(!ctx.accounts.open_loan.is_repaid, Errors::LoanAlreadyRepaid);

    const SECONDS_PER_YEAR: u64 = 31_536_000;

    msg!("11111111");
    let clock = Clock::get()?;
    let time_elapsed = (clock.unix_timestamp - ctx.accounts.open_loan.start_time).max(0) as u64;
    let duration_seconds = (ctx.accounts.open_loan.repay_by_time - ctx.accounts.open_loan.start_time) as u64;
    let effective_time = time_elapsed.min(duration_seconds);
    msg!("22222");

    let principal = ctx.accounts.open_loan.principal as u128;
    let interest_rate_bps = ctx.accounts.loan_info.interest_rate_bps as u128;
    let effective_time = effective_time as u128;
    let denominator = SECONDS_PER_YEAR as u128 * 10_000;

    let interest = ((principal * interest_rate_bps * effective_time) / denominator) as u64;
    let total_amount = ctx.accounts.open_loan.principal.checked_add(interest).ok_or(Errors::MathOverflow)?;

    msg!("33333");
    let is_loaned_sol = ctx.accounts.loaned_token_mint.key().to_string() == "So11111111111111111111111111111111111111112";

    if is_loaned_sol {
        msg!("44444");
        invoke(
            &system_instruction::transfer(
                &ctx.accounts.borrower.key(),
                &ctx.accounts.lender.key(),
                total_amount,
            ),
            &[
                ctx.accounts.borrower.to_account_info(),
                ctx.accounts.lender.clone(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    } else {
        msg!("55555");
        let cpi_accounts = Transfer {
            from: ctx.accounts.borrower_token_account.to_account_info(),
            to: ctx.accounts.lender_token_account.to_account_info(),
            authority: ctx.accounts.borrower.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_ctx, total_amount)?;
    }

    ctx.accounts.open_loan.is_repaid = true;
    ctx.accounts.loan_info.is_active = false;

    msg!("6666");
    let is_collateral_sol = ctx.accounts.collateral_token_mint.key().to_string() == "So11111111111111111111111111111111111111112";
    let amount_to_return = ctx.accounts.collateral_vault.amount;

    if amount_to_return > 0 {
        msg!("7777");
        let loan_info = ctx.accounts.loan_info.key();
        let borrower = ctx.accounts.borrower.key();
        let seeds = &[
            b"collateral_vault",
            loan_info.as_ref(),
            borrower.as_ref(),
            &[ctx.bumps.collateral_vault],
        ];
        let signer = &[&seeds[..]];

        if is_collateral_sol {
            use anchor_lang::solana_program::rent::Rent;

            let collateral_vault = ctx.accounts.collateral_vault.to_account_info();
            let borrower_account_info = ctx.accounts.borrower.to_account_info();

            let rent = Rent::get()?;
            let rent_exempt_minimum = rent.minimum_balance(collateral_vault.data_len());

            let vault_lamports = **collateral_vault.lamports.borrow();
            let amount_to_transfer = vault_lamports
                .checked_sub(rent_exempt_minimum)
                .ok_or(Errors::MathOverflow)?;

            // Debit collateral vault lamports
            **collateral_vault.lamports.borrow_mut() = vault_lamports
                .checked_sub(amount_to_transfer)
                .ok_or(Errors::MathOverflow)?;

            // Credit borrower lamports
            **borrower_account_info.lamports.borrow_mut() = borrower_account_info
                .lamports()
                .checked_add(amount_to_transfer)
                .ok_or(Errors::MathOverflow)?;
        } else {
            msg!("999");
            let cpi_accounts = Transfer {
                from: ctx.accounts.collateral_vault_token_account.to_account_info(),
                to: ctx.accounts.borrower_token_account.to_account_info(),
                authority: ctx.accounts.collateral_vault.to_account_info(),
            };
            msg!("101010101001");
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            msg!("210101010101");
            transfer(cpi_ctx, amount_to_return)?;
            msg!("33101001010");
        }

        msg!("Returned {} collateral to borrower", amount_to_return);
    }

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
pub struct PayLoan<'info> {
    #[account(
        mut,
        seeds = [b"open_loan", loan_info.key().as_ref(), borrower.key().as_ref()],
        bump
    )]
    pub open_loan: Account<'info, OpenLoan>,

    #[account(
        mut,
        seeds = [b"loan_info", lender.key().as_ref(), loaned_token_mint.key().as_ref()],
        bump
    )]
    pub loan_info: Account<'info, LoanInfo>,

    #[account(
        mut,
        seeds = [b"collateral_vault", loan_info.key().as_ref(), borrower.key().as_ref()],
        bump
    )]
    pub collateral_vault: Account<'info, CollateralVault>,

    #[account(mut)]
    /// CHECK: Only used if loaned token is SPL
    pub borrower_token_account: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: Only used if loaned token is SPL
    pub lender_token_account: AccountInfo<'info>,

    #[account(mut)]
    /// CHECK: Only used if collateral is SPL
    pub collateral_vault_token_account: AccountInfo<'info>,

    /// CHECK: Used to determine if collateral is SOL
    pub collateral_token_mint: AccountInfo<'info>,

    /// CHECK: Used to determine if loaned token is SOL
    pub loaned_token_mint: AccountInfo<'info>,

    #[account(mut)]
    pub borrower: Signer<'info>,

    #[account(constraint = loan_info.lender == lender.key())]
    /// CHECK: PDA only
    pub lender: AccountInfo<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
