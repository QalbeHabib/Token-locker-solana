import * as anchor from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import type { Constants } from "../target/types/constants";

// Configure the client to use the local cluster
anchor.setProvider(anchor.AnchorProvider.env());

const program = anchor.workspace.Constants as anchor.Program<Constants>;


// Program and token constants
const programIdPubKey = new PublicKey(
  "AmyqnALuxM2KCixrz5ZpJdZYjN21SZm2Lv3GruCMP5Nk"
);

const owner = program.provider.publicKey;
// const tokenMint = new PublicKey("3gLfp4jeMk4veJJJNyEh1PYxmgbAcyN2o2T3GNFnpKU2");
// const tokenMint = new PublicKey("GiqPjaTMTonC85W8XYfee6UGTvCq1UrFBU7U4MAgNBnS");
const tokenMint = new PublicKey("Ah1hf7NZgBhgnhFsrXLoj7czMMiVwUaCHnc5bP9wB6Ge");

const LOCKER_SEED = Buffer.from("token_locker");
const USER_INFO_SEED = Buffer.from("user_info");

// Amount and duration (modify as needed)
const amount = 1_000_000; // Example: 1 token with 6 decimals
const lock_duration = 60 * 60 * 24 * 30; // Example: 30 days

interface TokenLockParams {
  owner: PublicKey;
  tokenMint: PublicKey;
}

const deriveLockInfoAddress = (params: TokenLockParams) => {
  const [lockInfoPda, bump] = PublicKey.findProgramAddressSync(
    [LOCKER_SEED, params.owner.toBuffer(), params.tokenMint.toBuffer()],
    programIdPubKey
  );

  return { lockInfoPda, bump };
};

const deriveUserInfoAddress = (owner: PublicKey) => {
  const [userInfoPda, bump] = PublicKey.findProgramAddressSync(
    [USER_INFO_SEED, owner.toBuffer()],
    programIdPubKey
  );

  return { userInfoPda, bump };
};

const deriveVaultTokenAccount = (
  tokenMint: PublicKey,
  lockInfoPda: PublicKey
) => {
  return getAssociatedTokenAddressSync(
    tokenMint,
    lockInfoPda,
    true,
    TOKEN_PROGRAM_ID
  );
};

const deriveOwnerTokenAccount = (owner: PublicKey, tokenMint: PublicKey) => {
  return getAssociatedTokenAddressSync(
    tokenMint,
    owner,
    false,
    TOKEN_PROGRAM_ID
  );
};

// Main function
(async () => {
  const { lockInfoPda, bump: lockInfoBump } = deriveLockInfoAddress({
    owner,
    tokenMint,
  });
  const { userInfoPda, bump: userInfoBump } = deriveUserInfoAddress(owner);
  const vaultAddress = deriveVaultTokenAccount(tokenMint, lockInfoPda);
  const ownerTokenAccount = deriveOwnerTokenAccount(owner, tokenMint);

  console.log("=== Token Locking Parameters ===");
  console.log("programId:", programIdPubKey.toBase58());
  console.log("owner:", owner.toBase58());
  console.log("tokenMint:", tokenMint.toBase58());
  console.log("lockInfo:", lockInfoPda.toBase58());
  console.log("ownerTokenAccount:", ownerTokenAccount.toBase58());
  console.log("vaultTokenAccount:", vaultAddress.toBase58());
  console.log("userInfo:", userInfoPda.toBase58());
  console.log("tokenProgram:", TOKEN_PROGRAM_ID.toBase58());
  console.log(
    "associatedTokenProgram:",
    ASSOCIATED_TOKEN_PROGRAM_ID.toBase58()
  );
  console.log("systemProgram:", SystemProgram.programId.toBase58());
  console.log("amount:", amount);
  console.log("lockDuration:", lock_duration);
  console.log("lockInfoBump:", lockInfoBump);
  console.log("userInfoBump:", userInfoBump);
})();
