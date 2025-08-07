use anchor_lang::prelude::*;

#[account]
pub struct CollateralVault{
    pub borrower: Pubkey,
    pub token_mint: Pubkey,
    pub loan_info: Pubkey,
    pub amount: u64,
    pub is_active: bool,
    pub bump: u8,
}
