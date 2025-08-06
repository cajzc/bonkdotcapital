use anchor_lang::prelude::*;

#[account]
pub struct OpenLoan{
    pub loan_info: Pubkey,      // Reference to LoanInfo
    pub borrower: Pubkey,   // Borrower’s public key
    pub principal: u64,     // Borrowed amount
    pub start_time: i64,    // Slot when loan was accepted
    pub repay_by_time: i64, // Repayment deadline
    pub is_repaid: bool,    // Loan repayment status
    pub bump: u8,           // PDA bump seed
}

#[account]
pub struct LoanInfo{
    pub lender: Pubkey,         // Lender’s public key
    pub loan_token_mint: Pubkey,     // The token being loaned
    pub collateral_token_mint: Pubkey,     // The token that is accepted as collateral TODO: Change limit to > 1
    pub loan_amount: u64,            // Amount being lent
    pub collateral_amount: u64,            // Minimum amount to be accepted TODO: set minimum or cap
    pub interest_rate_bps: u16, // Interest rate in basis points (e.g., 500 = 5%)
    pub duration_seconds: u64,  // Loan duration in seconds (e.g., 30 days = 2,592,000 seconds)
    pub min_score: u64,         // Minimum borrower score
    pub vault: Pubkey,          // Vault token account (PDA)
    pub is_active: bool,        // Offer status
    pub bump: u8,               // PDA bump seed
}
