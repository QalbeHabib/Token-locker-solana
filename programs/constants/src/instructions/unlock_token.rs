use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use crate::{constants::*, errors::*, state::*};

#[derive(Accounts)]
pub struct UnlockToken<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub token_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        seeds = [
            LOCKER_SEED,
            owner.key().as_ref(),
            token_mint.key().as_ref(),
        ],
        bump = lock_info.bump,
        constraint = lock_info.owner == owner.key() @ TokenLockerError::UnauthorizedAccess,
    )]
    pub lock_info: Account<'info, LockInfo>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = owner,
    )]
    pub owner_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = lock_info,
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UnlockToken>) -> Result<()> {
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp >= ctx.accounts.lock_info.lock_end_time,
        TokenLockerError::LockNotExpired
    );

    let authority_seeds = &[
        LOCKER_SEED,
        ctx.accounts.lock_info.owner.as_ref(),
        ctx.accounts.lock_info.token_mint.as_ref(),
        &[ctx.accounts.lock_info.bump],
    ];
    let signer = &[&authority_seeds[..]];

    // Transfer all tokens back to owner
    anchor_spl::token_interface::transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token_interface::TransferChecked {
                from: ctx.accounts.vault_token_account.to_account_info(),
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.owner_token_account.to_account_info(),
                authority: ctx.accounts.lock_info.to_account_info(),
            },
            signer,
        ),
        ctx.accounts.lock_info.amount,
        ctx.accounts.token_mint.decimals,
    )?;

    // Reset locked amount
    let lock_info = &mut ctx.accounts.lock_info;
    lock_info.amount = 0;

    Ok(())
}
