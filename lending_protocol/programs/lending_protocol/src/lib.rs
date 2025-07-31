use anchor_lang::prelude::*;

mod error;
mod instructions;
mod state;

declare_id!("EgGEeoSmoZCBZdfyiTCFbPqhSABeFnWhUN6NqiUZEjH4");

#[program]
pub mod lending_protocol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Lending protocol initialized: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn create_loan(
        ctx: Context<instructions::create_loan::CreateLoan>,
        amount: u64,
        interest_rate_bps: u16,
        duration_slots: u64,
        min_score: u64,
        bump: u8,
    ) -> Result<()> {
        instructions::create_loan::create_loan(
            ctx,
            amount,
            interest_rate_bps,
            duration_slots,
            min_score,
            bump,
        )
    }

    pub fn accept_loan(
        ctx: Context<instructions::accept_loan::AcceptLoan>,
        bump: u8,
    ) -> Result<()> {
        instructions::accept_loan::accept_loan(ctx, bump)
    }

    pub fn repay_loan(
        ctx: Context<instructions::repay_loan::RepayLoan>,
        repayment_amount: u64,
    ) -> Result<()> {
        instructions::repay_loan::repay_loan(ctx, repayment_amount)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
