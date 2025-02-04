import * as anchor from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";
// Claude

// import {
//   TOKEN_PROGRAM_ID,
//   getAssociatedTokenAddressSync,
//   ASSOCIATED_TOKEN_PROGRAM_ID,
// } from "@solana/spl-token";
// import { PublicKey, SystemProgram } from "@solana/web3.js";

// // Program and token constants
// const programIdPubKey = new PublicKey(
//   "DEtNQiaWnjaTLUpETYZkjfVpdfswg8DLQM5gs7dP3Y5j"
// );

// const owner = program.provider.publicKey;
// // const tokenMint = new PublicKey("3gLfp4jeMk4veJJJNyEh1PYxmgbAcyN2o2T3GNFnpKU2");
// const tokenMint = new PublicKey("Ah1hf7NZgBhgnhFsrXLoj7czMMiVwUaCHnc5bP9wB6Ge");

// const LOCKER_SEED = Buffer.from("token_locker");

// interface UnlockTokenParams {
//   owner: PublicKey;
//   tokenMint: PublicKey;
// }

// const deriveLockInfoAddress = (params: UnlockTokenParams) => {
//   const [lockInfoPda, bump] = PublicKey.findProgramAddressSync(
//     [LOCKER_SEED, params.owner.toBuffer(), params.tokenMint.toBuffer()],
//     programIdPubKey
//   );

//   return { lockInfoPda, bump };
// };

// const deriveVaultTokenAccount = (
//   tokenMint: PublicKey,
//   lockInfoPda: PublicKey
// ) => {
//   return getAssociatedTokenAddressSync(
//     tokenMint,
//     lockInfoPda,
//     true,
//     TOKEN_PROGRAM_ID
//   );
// };

// const deriveOwnerTokenAccount = (owner: PublicKey, tokenMint: PublicKey) => {
//   return getAssociatedTokenAddressSync(
//     tokenMint,
//     owner,
//     false,
//     TOKEN_PROGRAM_ID
//   );
// };

// // Main function
// (async () => {
//   try {
//     // Derive all necessary addresses
//     const { lockInfoPda, bump: lockInfoBump } = deriveLockInfoAddress({
//       owner,
//       tokenMint,
//     });
//     const vaultTokenAccount = deriveVaultTokenAccount(tokenMint, lockInfoPda);
//     const ownerTokenAccount = deriveOwnerTokenAccount(owner, tokenMint);

//     // Log all parameters needed for the unlock instruction
//     console.log("=== Unlock Token Parameters ===");
//     console.log("programId:", programIdPubKey.toBase58());
//     console.log("owner:", owner.toBase58());
//     console.log("tokenMint:", tokenMint.toBase58());
//     console.log("lockInfo:", lockInfoPda.toBase58());
//     console.log("ownerTokenAccount:", ownerTokenAccount.toBase58());
//     console.log("vaultTokenAccount:", vaultTokenAccount.toBase58());
//     console.log("tokenProgram:", TOKEN_PROGRAM_ID.toBase58());
//     console.log(
//       "associatedTokenProgram:",
//       ASSOCIATED_TOKEN_PROGRAM_ID.toBase58()
//     );
//     console.log("systemProgram:", SystemProgram.programId.toBase58());
//     console.log("lockInfoBump:", lockInfoBump);
//   } catch (error) {
//     console.error("Error:", error);
//   }
// })();

import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";import type { Constants } from "../target/types/constants";

// Configure the client to use the local cluster
anchor.setProvider(anchor.AnchorProvider.env());

const program = anchor.workspace.Constants as anchor.Program<Constants>;



// Program and token constants
const programIdPubKey = new PublicKey(
  "AmyqnALuxM2KCixrz5ZpJdZYjN21SZm2Lv3GruCMP5Nk"
);

const owner = program.provider.publicKey;
const tokenMint = new PublicKey("Ah1hf7NZgBhgnhFsrXLoj7czMMiVwUaCHnc5bP9wB6Ge");

const LOCKER_SEED = Buffer.from("token_locker");

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
  try {
    // Derive all required accounts
    const { lockInfoPda, bump: lockInfoBump } = deriveLockInfoAddress({
      owner,
      tokenMint,
    });
    const vaultTokenAccount = deriveVaultTokenAccount(tokenMint, lockInfoPda);
    const ownerTokenAccount = deriveOwnerTokenAccount(owner, tokenMint);

    // Log parameters with program's account names
    console.log("=== Unlock Token Parameters ===");
    console.log("programId:", programIdPubKey.toBase58());
    console.log("owner:", owner.toBase58());
    console.log("tokenMint:", tokenMint.toBase58());
    console.log("lockInfo:", lockInfoPda.toBase58());
    console.log("ownerTokenAccount:", ownerTokenAccount.toBase58());
    console.log("vaultTokenAccount:", vaultTokenAccount.toBase58());
    console.log("tokenProgram:", TOKEN_PROGRAM_ID.toBase58());
    console.log(
      "associatedTokenProgram:",
      ASSOCIATED_TOKEN_PROGRAM_ID.toBase58()
    );
    console.log("systemProgram:", SystemProgram.programId.toBase58());
    console.log("lockInfoBump:", lockInfoBump);
  } catch (error) {
    console.error("Error:", error);
  }
})();
