use anchor_lang::prelude::*;

#[account]
pub struct Obligation {
    pub borrower: Pubkey,
    pub collateral_token_mint: Pubkey,
    pub collateral_account: Pubkey,
    pub deposited_amount: u64,
    pub loan_active: bool,
    pub bump: u8,
}
