use anchor_lang::prelude::*;

#[account]
pub struct BorrowerProfile {
    pub borrower: Pubkey,       // Borrower’s public key
    pub score: u64,             // Credit score (e.g., 0-1000)
    pub metadata: Vec<u8>,      // Serialized metadata (e.g., transaction history)
    pub last_updated_slot: u64, // When the score was last updated
    pub bump: u8,               // PDA bump seed
}
