use anchor_lang::prelude::*;

#[account]
pub struct Loan {
    pub offer: Pubkey,      // Reference to LoanOffer
    pub borrower: Pubkey,   // Borrower’s public key
    pub principal: u64,     // Borrowed amount
    pub start_slot: u64,    // Slot when loan was accepted
    pub repay_by_slot: u64, // Repayment deadline
    pub interest_owed: u64, // Interest to be paid (updated at repayment)
    pub is_repaid: bool,    // Loan repayment status
    pub bump: u8,           // PDA bump seed
}
