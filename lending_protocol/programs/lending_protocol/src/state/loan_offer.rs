use anchor_lang::prelude::*;

#[account]
pub struct LoanOffer {
    pub lender: Pubkey,         // Lender’s public key
    pub token_mint: Pubkey,     // Token type (e.g., USDC mint)
    pub amount: u64,            // Loan amount
    pub interest_rate_bps: u16, // Interest rate in basis points (e.g., 500 = 5%)
    pub duration_slots: u64,    // Loan duration in slots (e.g., ~30 days)
    pub min_score: u64,         // Minimum borrower score
    pub vault: Pubkey,          // Vault token account (PDA)
    pub is_active: bool,        // Offer status
    pub bump: u8,               // PDA bump seed
}
