use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::errors::Errors;
use crate::state::obligation::Obligation;

pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64, bump: u8) -> Result<()> {
    require!(amount > 0, Errors::InvalidAmount);

    let obligation = &mut ctx.accounts.obligation;
    obligation.borrower = ctx.accounts.borrower.key();
    obligation.collateral_token_mint = ctx.accounts.token_mint.key();
    obligation.collateral_account = ctx.accounts.collateral_vault.key();
    obligation.bump = bump;
    obligation.deposited_amount = obligation
        .deposited_amount
        .checked_add(amount)
        .ok_or(Errors::MathOverflow)?;

    let cpi_accounts = Transfer {
        from: ctx.accounts.borrower_token_account.to_account_info(),
        to: ctx.accounts.collateral_vault.to_account_info(),
        authority: ctx.accounts.borrower.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    msg!(
        "Borrower {} deposited {} collateral",
        obligation.borrower,
        amount
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64, bump: u8)]
pub struct DepositCollateral<'info> {
    #[account(
     init_if_needed,
     payer = borrower,
     space = 8 + 32 + 32 + 32 + 8 + 1 + 1,
     seeds = [b"obligation", borrower.key().as_ref()],
     bump
    )]
    pub obligation: Account<'info, Obligation>,
    #[account(
     mut,
     token::mint = token_mint,
     token::authority = borrower
    )]
    pub borrower_token_account: Account<'info, TokenAccount>,
    #[account(
     init_if_needed,
     payer = borrower,
     token::mint = token_mint,
     token::authority = obligation,
     seeds = [b"collateral_vault", borrower.key().as_ref(), token_mint.key().as_ref()],
     bump
    )]
    pub collateral_vault: Account<'info, TokenAccount>,

    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub borrower: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
