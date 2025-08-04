use anchor_lang::prelude::*;

#[account]
pub struct Loan {
    pub offer: Pubkey,      // Reference to LoanOffer
    pub borrower: Pubkey,   // Borrower’s public key
    pub principal: u64,     // Borrowed amount
    pub start_time: i64,    // Slot when loan was accepted
    pub repay_by_time: i64, // Repayment deadline
    pub is_repaid: bool,    // Loan repayment status
    pub bump: u8,           // PDA bump seed
}

#[account]
pub struct LoanOffer {
    pub lender: Pubkey,         // Lender’s public key
    pub token_mint: Pubkey,     // Token type (e.g., USDC mint)
    pub amount: u64,            // Loan amount
    pub interest_rate_bps: u16, // Interest rate in basis points (e.g., 500 = 5%)
    pub duration_seconds: u64,  // Loan duration in seconds (e.g., 30 days = 2,592,000 seconds)
    pub min_score: u64,         // Minimum borrower score
    pub vault: Pubkey,          // Vault token account (PDA)
    pub is_active: bool,        // Offer status
    pub bump: u8,               // PDA bump seed
}
