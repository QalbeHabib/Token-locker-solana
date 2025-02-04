use anchor_lang::prelude::*;
#[error_code]
pub enum TokenLockerError {
    #[msg("Lock duration must be greater than minimum lock period (15 minutes)")]
    LockDurationTooShort,

    #[msg("Lock duration exceeds maximum allowed period")]
    LockDurationTooLong,

    #[msg("Token amount must be greater than zero")]
    InvalidAmount,

    #[msg("Tokens are still locked")]
    TokensStillLocked,

    #[msg("Lock period has not expired yet")]
    LockNotExpired, // <-- ADD THIS LINE

    #[msg("Only token owner can perform this action")]
    UnauthorizedAccess,

    #[msg("Invalid token account")]
    InvalidTokenAccount,

    #[msg("You Already Withdraw you Early Token.")]
    AlreadyWithdrawn,
}
