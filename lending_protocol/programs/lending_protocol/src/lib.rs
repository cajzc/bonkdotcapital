use anchor_lang::prelude::*;

declare_id!("5KZEGGgKN8FEKXHvqjJ169Adxdkj2JmNVNfHdRBytsvS");

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;


#[program]
pub mod lending_protocol {
    use super::*;

    /// Testing purposes
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Testing lending protocol: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn create_loan(
        ctx: Context<CreateLoan>,
        amount: u64,
        interest_rate_bps: u16,
        duration_slots: u64,
        min_score: u64,
    ) -> Result<()> {
        instructions::create_loan(
            ctx,
            amount,
            interest_rate_bps,
            duration_slots,
            min_score,
        )
    }

    pub fn take_loan(ctx: Context<TakeLoan>, amount: u64) -> Result<()> {
        instructions::take_loan(ctx, amount)
    }

    pub fn pay_loan(ctx: Context<PayLoan>) -> Result<()> {
        instructions::pay_loan(ctx)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
