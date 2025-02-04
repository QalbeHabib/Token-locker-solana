import BN from "bn.js";
import assert from "assert";
import * as web3 from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TokenLockerProgram } from "../target/types/token_locker_program";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import * as assert from "assert";
import type { Constants } from "../target/types/constants";

describe("token-locker-program", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Constants as anchor.Program<Constants>;
  
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .TokenLockerProgram as Program<TokenLockerProgram>;

  // Test accounts
  let mint: PublicKey;
  let mintAuthority: Keypair;
  let ownerTokenAccount: PublicKey;
  let vaultTokenAccount: PublicKey;
  let lockInfoPda: PublicKey;
  let lockInfoBump: number;

  const owner = Keypair.generate();
  const amount = new anchor.BN(1_000_000_000); // 1 token with 9 decimals
  const lockDuration = new anchor.BN(86400); // 1 day in seconds

  before(async () => {
    // Airdrop SOL to owner and mint authority
    const airdropAmount = 2 * anchor.web3.LAMPORTS_PER_SOL;

    // Fund owner account
    const ownerSignature = await provider.connection.requestAirdrop(
      owner.publicKey,
      airdropAmount
    );
    await provider.connection.confirmTransaction(ownerSignature);

    // Create and fund mint authority
    mintAuthority = Keypair.generate();
    const mintAuthoritySignature = await provider.connection.requestAirdrop(
      mintAuthority.publicKey,
      airdropAmount
    );
    await provider.connection.confirmTransaction(mintAuthoritySignature);

    // Create new token mint
    mint = await createMint(
      provider.connection,
      owner, // payer
      mintAuthority.publicKey, // mint authority
      null, // freeze authority
      9, // decimals
      undefined, // keypair
      undefined, // options
      TOKEN_2022_PROGRAM_ID
    );

    // Create owner's token account
    ownerTokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      owner,
      mint,
      owner.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    // Mint tokens to owner
    await mintTo(
      provider.connection,
      owner,
      mint,
      ownerTokenAccount,
      mintAuthority,
      amount.toNumber(),
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    // Derive PDA for lock info
    [lockInfoPda, lockInfoBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("token_locker"),
        owner.publicKey.toBuffer(),
        mint.toBuffer(),
      ],
      program.programId
    );

    // Get vault token account address
    vaultTokenAccount = getAssociatedTokenAddressSync(
      mint,
      lockInfoPda,
      true,
      TOKEN_2022_PROGRAM_ID
    );
  });

  it("Locks tokens", async () => {
    await program.methods
      .lockToken(amount, lockDuration)
      .accounts({
        owner: owner.publicKey,
        tokenMint: mint,
        lockInfo: lockInfoPda,
        ownerTokenAccount,
        vaultTokenAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    // Verify lock info account
    const lockInfo = await program.account.lockInfo.fetch(lockInfoPda);
    assert.ok(lockInfo.owner.equals(owner.publicKey));
    assert.ok(lockInfo.tokenMint.equals(mint));
    assert.ok(lockInfo.amount.eq(amount));
    assert.ok(lockInfo.isEarlyWithdrawalEnabled === true);

    // Verify tokens were transferred to vault
    const vaultAccount = await getAccount(
      provider.connection,
      vaultTokenAccount,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    assert.equal(vaultAccount.amount.toString(), amount.toString());
  });

  it("Fails to unlock tokens before lock period ends", async () => {
    try {
      await program.methods
        .unlockToken()
        .accounts({
          owner: owner.publicKey,
          tokenMint: mint,
          lockInfo: lockInfoPda,
          ownerTokenAccount,
          vaultTokenAccount,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([owner])
        .rpc();
      assert.fail("Expected unlock to fail");
    } catch (err) {
      assert.ok((err as Error).message.includes("TokensStillLocked"));
    }
  });

  it("Performs early withdrawal with penalty", async () => {
    const preBalance = (
      await getAccount(
        provider.connection,
        ownerTokenAccount,
        undefined,
        TOKEN_2022_PROGRAM_ID
      )
    ).amount;

    await program.methods
      .earlyWithdraw()
      .accounts({
        owner: owner.publicKey,
        tokenMint: mint,
        lockInfo: lockInfoPda,
        ownerTokenAccount,
        vaultTokenAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    // Verify penalty was applied (20% burned)
    const postBalance = (
      await getAccount(
        provider.connection,
        ownerTokenAccount,
        undefined,
        TOKEN_2022_PROGRAM_ID
      )
    ).amount;

    const expectedAmount = amount.muln(80).divn(100); // 80% of original amount
    assert.equal(postBalance.toString(), expectedAmount.toString());
  });

  it("Successfully unlocks tokens after lock period", async () => {
    // First lock some tokens again
    await program.methods
      .lockToken(amount, new anchor.BN(1)) // 1 second lock
      .accounts({
        owner: owner.publicKey,
        tokenMint: mint,
        lockInfo: lockInfoPda,
        ownerTokenAccount,
        vaultTokenAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    // Wait for lock period to end
    // await new Promise((resolve) => setTimeout(resolve, 2000));

    // Unlock tokens
    await program.methods
      .unlockToken()
      .accounts({
        owner: owner.publicKey,
        tokenMint: mint,
        lockInfo: lockInfoPda,
        ownerTokenAccount,
        vaultTokenAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    // Verify tokens were returned
    const vaultBalance = (
      await getAccount(
        provider.connection,
        vaultTokenAccount,
        undefined,
        TOKEN_2022_PROGRAM_ID
      )
    ).amount;

    assert.equal(vaultBalance.toString(), "0");
  });
});
