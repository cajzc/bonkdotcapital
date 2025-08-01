use anchor_lang::prelude::*;

#[error_code]
pub enum Errors {
    #[msg("Loan amount must be greater than zero")]
    InvalidAmount,
    #[msg("Interest rate must be greater than zero")]
    InvalidInterestRate,
    #[msg("Loan duration must be greater than zero")]
    InvalidDuration,
    #[msg("Minimum score must be valid (0-1000)")]
    InvalidScore,
    #[msg("Loan offer is not active")]
    OfferNotActive,
    #[msg("Borrower score is insufficient")]
    InsufficientScore,
    #[msg("Loan offer has expired")]
    LoanOfferExpired,
    #[msg("Loan already repaid")]
    LoanAlreadyRepaid,
    #[msg("Insufficient repayment amount")]
    InsufficientRepayment,
    #[msg("Loan repayment overdue it got liquidated")]
    LoanRepaymentOverdue,
}
