pub const LOCKER_SEED: &[u8] = b"token_locker";
pub const USER_INFO_SEED: &[u8] = b"user_info";

// Minimum lock duration (15 minutes in seconds)
pub const MIN_LOCK_DURATION: i64 = 900;

// Early withdrawal penalty percentage (20%)
pub const EARLY_WITHDRAWAL_PENALTY: u8 = 20;

// Maximum lock duration (2 years in seconds)
pub const MAX_LOCK_DURATION: i64 = 63072000;
