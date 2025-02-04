use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use crate::{constants::*, errors::*, state::*};

// Instruction: LockToken
#[derive(Accounts)]
#[instruction(amount: u64, lock_duration: i64, is_early_withdrawal_enabled: bool)]
pub struct LockToken<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub token_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + LockInfo::SPACE,
        seeds = [LOCKER_SEED, owner.key().as_ref(), token_mint.key().as_ref()],
        bump
    )]
    pub lock_info: Account<'info, LockInfo>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = owner
    )]
    pub owner_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = token_mint,
        associated_token::authority = lock_info
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + UserInfo::SPACE,
        seeds = [USER_INFO_SEED, owner.key().as_ref()],
        bump
    )]
    pub user_info: Account<'info, UserInfo>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<LockToken>, amount: u64, lock_duration: i64, is_early_withdrawal_enabled: bool) -> Result<()> {
    // Validate inputs
    require!(amount > 0, TokenLockerError::InvalidAmount);
    require!(
        lock_duration >= MIN_LOCK_DURATION,
        TokenLockerError::LockDurationTooShort
    );
    require!(
        lock_duration <= MAX_LOCK_DURATION,
        TokenLockerError::LockDurationTooLong
    );

    let clock = Clock::get()?;
    let lock_info = &mut ctx.accounts.lock_info;
    let user_info = &mut ctx.accounts.user_info;

    // If this is a new lock, initialize the account
    if lock_info.owner == Pubkey::default() {
        lock_info.owner = ctx.accounts.owner.key();
        lock_info.token_mint = ctx.accounts.token_mint.key();
        lock_info.amount = 0; // Will be updated below
        lock_info.bump = ctx.bumps.lock_info;
        lock_info.is_early_withdrawal_enabled = is_early_withdrawal_enabled;
    }

    // Validate owner
    require!(
        lock_info.owner == ctx.accounts.owner.key(),
        TokenLockerError::UnauthorizedAccess
    );

    // Update lock info
    lock_info.amount = lock_info
        .amount
        .checked_add(amount)
        .ok_or(TokenLockerError::InvalidAmount)?;
    lock_info.lock_start_time = clock.unix_timestamp;
    lock_info.lock_end_time = clock.unix_timestamp + lock_duration;

    // Update user info
    user_info.owner = ctx.accounts.owner.key();
    user_info.total_locks += 1;
    user_info.total_locked_amount = user_info
        .total_locked_amount
        .checked_add(amount)
        .ok_or(TokenLockerError::InvalidAmount)?;
    user_info.last_lock_time = clock.unix_timestamp;
    user_info.bump = ctx.bumps.user_info;

    // Transfer tokens to vault
    anchor_spl::token_interface::transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token_interface::TransferChecked {
                from: ctx.accounts.owner_token_account.to_account_info(),
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        ),
        amount,
        ctx.accounts.token_mint.decimals,
    )?;

    Ok(())
}
