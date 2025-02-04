use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_2022};

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;
use state::*;

declare_id!("AmyqnALuxM2KCixrz5ZpJdZYjN21SZm2Lv3GruCMP5Nk"); // Replace with your program ID

#[program]
pub mod token_locker_program {
    use super::*;

    pub fn lock_token(ctx: Context<LockToken>, amount: u64, lock_duration: i64) -> Result<()> {
        instructions::lock_token::handler(ctx, amount, lock_duration)
    }

    pub fn unlock_token(ctx: Context<UnlockToken>) -> Result<()> {
        instructions::unlock_token::handler(ctx)
    }

    pub fn early_withdraw(ctx: Context<EarlyWithdraw>) -> Result<()> {
        instructions::early_withdraw::handler(ctx)
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[cfg(test)]
mod tests {
    use super::*;
    use anchor_lang::solana_program::clock::Clock;
    use anchor_lang::solana_program::system_program;
    use anchor_lang::solana_program::sysvar::rent::Rent;

    #[test]
    fn test_lock_token() {
        // Create test environment
        let program_id = id();
        let owner = Pubkey::new_unique();
        let token_mint = Pubkey::new_unique();

        // Test lock duration and amount
        let amount = 1000;
        let lock_duration = 900; // 15 minutes

        // Create PDA for lock_info
        let (lock_info_pda, _bump) = Pubkey::find_program_address(
            &[LOCKER_SEED, owner.as_ref(), token_mint.as_ref()],
            &program_id,
        );

        // Verify lock duration constraints
        assert!(
            lock_duration >= MIN_LOCK_DURATION,
            "Lock duration too short"
        );
        assert!(lock_duration <= MAX_LOCK_DURATION, "Lock duration too long");
    }

    #[test]
    fn test_unlock_token() {
        let program_id = id();
        let owner = Pubkey::new_unique();
        let token_mint = Pubkey::new_unique();

        // Create PDA for lock_info
        let (lock_info_pda, bump) = Pubkey::find_program_address(
            &[LOCKER_SEED, owner.as_ref(), token_mint.as_ref()],
            &program_id,
        );

        // Verify PDA derivation
        assert_ne!(lock_info_pda, Pubkey::default(), "Invalid PDA derivation");
    }

    #[test]
    fn test_early_withdraw() {
        let amount = 1000;
        let penalty_amount = (amount as u128 * EARLY_WITHDRAWAL_PENALTY as u128 / 100) as u64;
        let withdraw_amount = amount - penalty_amount;

        // Verify penalty calculation
        assert_eq!(penalty_amount, 200, "Incorrect penalty calculation");
        assert_eq!(
            withdraw_amount, 800,
            "Incorrect withdraw amount calculation"
        );
    }
}
