use anchor_lang::prelude::*;

declare_id!("5KZEGGgKN8FEKXHvqjJ169Adxdkj2JmNVNfHdRBytsvS");

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

#[program]
pub mod lending_protocol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Lending protocol initialized: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn initialize_create_loan(
        ctx: Context<CreateLoan>,
        amount: u64,
        interest_rate_bps: u16,
        duration_slots: u64,
        min_score: u64,
        bump: u8,
    ) -> Result<()> {
        create_loan(
            ctx,
            amount,
            interest_rate_bps,
            duration_slots,
            min_score,
            bump,
        )
    }

    pub fn initialize_obligation(
        ctx: Context<DepositCollateral>,
        amount: u64,
        bump: u8,
    ) -> Result<()> {
        deposit_collateral(ctx, amount, bump)
    }

    pub fn intialize_accept_loan(ctx: Context<AcceptLoan>, bump: u8) -> Result<()> {
        accept_loan(ctx, bump)
    }

    pub fn initialize_pay_loan(ctx: Context<PayLoan>) -> Result<()> {
        pay_loan(ctx)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
