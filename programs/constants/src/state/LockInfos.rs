use anchor_lang::prelude::*;

#[account]
pub struct LockInfo {
    pub owner: Pubkey,                // The owner of the locked tokens
    pub token_mint: Pubkey,           // The mint of the token being locked
    pub amount: u64,                  // Amount of tokens locked
    pub lock_start_time: i64,         // When the tokens were locked
    pub lock_end_time: i64,           // When the tokens can be unlocked
    pub is_early_withdrawal_enabled: bool, // Whether early withdrawal is enabled
    pub bump: u8,                     // PDA bump
}

impl LockInfo {
    pub const SPACE: usize = 8 +  // discriminator
        32 +    // owner
        32 +    // token_mint
        8 +     // amount
        8 +     // lock_start_time
        8 +     // lock_end_time
        1 +     // is_early_withdrawal_enabled
        1;      // bump
} 