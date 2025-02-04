use anchor_lang::prelude::*;

#[account]
pub struct UserInfo {
    pub owner: Pubkey,                // User's wallet address
    pub total_locks: u64,             // Total number of tokens locked by user
    pub total_locked_amount: u64,     // Total amount of tokens locked
    pub last_lock_time: i64,          // Timestamp of last lock
    pub bump: u8,                     // PDA bump
} 