use anchor_lang::prelude::*;

#[error_code]
pub enum Errors {
    #[msg("Loan amount must be greater than zero")]
    InvalidLoanAmount,
    #[msg("Collateral amount must be greater than zero")]
    InvalidCollateralAmount,
    #[msg("Supplied token not accepted as collateral")]
    InvalidCollateralToken,
    #[msg("Not enough tokens for collateral")]
    CollateralNotEnough,
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
    #[msg("Math overflow occurred")]
    MathOverflow,
    #[msg("Borrower already has an active loan.")]
    LoanAlreadyExists,
    #[msg("Missing collateral vault token account.")]
    MissingCollateralVaultTokenAccount,
    #[msg("Missing borrower token account.")]
    MissingBorrowerTokenAccount,
    #[msg("Missing borrower repay token account.")]
    MissingBorrowerRepayTokenAccount,
}
