import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import {
  AccountLayout,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { MmEscrow } from "../target/types/mm_escrow";
import {
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Ed25519Program,
  Transaction,
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from "@solana/web3.js";
import wallet from "./ernest_key.json";

const assert = require("assert");

const confirmTx = async (signature: string) => {
  const latestBlockhash = await anchor
    .getProvider()
    .connection.getLatestBlockhash();
  await anchor.getProvider().connection.confirmTransaction({
    signature,
    ...latestBlockhash,
  });
  return signature;
};

const log = async (signature: string): Promise<string> => {
  console.log(
    `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${
      anchor.getProvider().connection.rpcEndpoint
    }`
  );
  return signature.toString();
};

async function getAccountBalance(
  connection: Connection,
  pk: PublicKey
): Promise<bigint> {
  const accountInfo = await connection.getAccountInfo(pk);
  const data = Buffer.from(accountInfo.data);
  const tokenAccountInfo = AccountLayout.decode(data);

  return tokenAccountInfo.amount;
}

async function getTokenAccountBalance(
  connection: Connection,
  pk: PublicKey
): Promise<bigint> {
  let amount = (await connection.getTokenAccountBalance(pk)).value.amount;

  return BigInt(amount);
}

function intToBytes(int: number): Uint8Array {
  let buffer = new ArrayBuffer(4); // Create a buffer of 4 bytes (32 bits).
  let view = new DataView(buffer);
  view.setUint32(0, int, true); // Write the integer to the buffer. 'true' for little endian.
  return new Uint8Array(buffer);
}

describe("mm_escrow", () => {
  const msgInt: Uint8Array = intToBytes(100);
  const adminKeypair = Keypair.fromSecretKey(new Uint8Array(wallet));
  const program = anchor.workspace.MmEscrow as Program<MmEscrow>;
  const provider = anchor.AnchorProvider.env();
  const seller = Keypair.generate();
  const buyer = Keypair.generate();
  let x_mint: PublicKey;
  let y_mint: PublicKey;
  let sellers_x_token: splToken.Account;
  let sellers_y_token: splToken.Account;
  let buyers_x_token: splToken.Account;
  let buyers_y_token: splToken.Account;
  const mint_amount = 10000;
  let escrow: PublicKey;
  let escrowedXTokens: PublicKey;
  const x_amount = new anchor.BN(1000);
  const y_price = new anchor.BN(1);
  const y_amount = new anchor.BN(10);
  const x_requested = new anchor.BN(10);

  const productIdAccept = "ACCEPT_ID";
  const productIdCancel = "CANCEL_ID";

  it("Airdrops", async () => {
    await Promise.all(
      [buyer, seller].map(async (account) => {
        await provider.connection
          .requestAirdrop(account.publicKey, 100 * LAMPORTS_PER_SOL)
          .then(confirmTx);
      })
    );
  });

  it("Finds PDAs", async () => {
    escrow = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("escrow"),
        seller.publicKey.toBuffer(),
        anchor.utils.bytes.utf8.encode(productIdAccept),
      ],
      program.programId
    )[0];

    escrowedXTokens = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("escrow"), escrow.toBuffer()],
      program.programId
    )[0];
  });

  it("Create mints", async () => {
    x_mint = await splToken.createMint(
      provider.connection,
      seller,
      seller.publicKey,
      seller.publicKey,
      6
    );

    y_mint = await splToken.createMint(
      provider.connection,
      buyer,
      buyer.publicKey,
      buyer.publicKey,
      6
    );
  });

  it("Create ATAs", async () => {
    sellers_x_token = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      seller,
      x_mint,
      seller.publicKey
    );

    sellers_y_token = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      seller,
      y_mint,
      seller.publicKey
    );

    buyers_x_token = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      buyer,
      x_mint,
      buyer.publicKey
    );

    buyers_y_token = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      buyer,
      y_mint,
      buyer.publicKey
    );
  });

  it("Mint tokens", async () => {
    const mint_x_token_seller = await splToken.mintTo(
      provider.connection,
      seller,
      x_mint,
      sellers_x_token.address,
      seller,
      mint_amount
    );

    assert.equal(
      await getTokenAccountBalance(
        provider.connection,
        sellers_x_token.address
      ),
      mint_amount.toString(),
      "seller should have the x tokens minted to his ATA"
    );

    const mint_y_token_buyer = await splToken.mintTo(
      provider.connection,
      buyer,
      y_mint,
      buyers_y_token.address,
      buyer,
      mint_amount
    );

    assert.equal(
      await getTokenAccountBalance(provider.connection, buyers_y_token.address),
      mint_amount.toString(),
      "buyer should have the y tokens minted to his ATA"
    );
  });

  it("Init", async () => {
    const tx1 = await program.methods
      .initialize(x_amount, y_price, productIdAccept)
      .accounts({
        seller: seller.publicKey,
        xMint: x_mint,
        yMint: y_mint,
        sellersXToken: sellers_x_token.address,
        escrow: escrow,
        escrowedXTokens: escrowedXTokens,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([seller])
      .rpc()
      .then(confirmTx)
      //.then(log);
      .catch((e) => console.error(e));

    assert.equal(
      await getAccountBalance(provider.connection, escrowedXTokens),
      x_amount.toString(),
      "Escrow vault account should have the correct deposit amount"
    );
  });

  it("Accept_With_Stripe_Payment", async () => {
    const ed25519Ix = Ed25519Program.createInstructionWithPrivateKey({
      privateKey: adminKeypair.secretKey,
      message: msgInt,
    });

    const acceptIx = await program.methods
      .accept(x_requested, y_amount)
      .accounts({
        escrow: escrow,
        escrowedXTokens: escrowedXTokens,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        buyer: buyer.publicKey,
        sellersYTokens: sellers_y_token.address,
        buyersXTokens: buyers_x_token.address,
        buyersYTokens: buyers_y_token.address,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .instruction();

    const tx = new Transaction().add(ed25519Ix, acceptIx);

    await provider.sendAndConfirm(tx, [buyer]).then(confirmTx).then(log);

    assert.equal(
      await getTokenAccountBalance(provider.connection, buyers_x_token.address),
      x_requested.toString(),
      "Buyer should have the correct x token amount"
    );

    assert.equal(
      await getTokenAccountBalance(
        provider.connection,
        sellers_y_token.address
      ),
      "0",
      "Seller should not have received any tokens at this point"
    );

    assert.equal(
      await getAccountBalance(provider.connection, escrowedXTokens),
      x_amount.sub(x_requested).toString(),
      "Vault needs to be empty after the 'accept' method is called"
    );
  });

  it("Accept_Normal", async () => {
    const startAmountBuyer = x_requested;
    const startAmountVault = await getTokenAccountBalance(
      provider.connection,
      escrowedXTokens
    );
    const tx2 = await program.methods
      .accept(x_requested, y_amount)
      .accounts({
        escrow: escrow,
        escrowedXTokens: escrowedXTokens,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        buyer: buyer.publicKey,
        sellersYTokens: sellers_y_token.address,
        buyersXTokens: buyers_x_token.address,
        buyersYTokens: buyers_y_token.address,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([buyer])
      .rpc()
      .then(confirmTx)
      //.then(log);
      .catch((e) => console.log(e));

    assert.equal(
      await getTokenAccountBalance(provider.connection, buyers_x_token.address),
      startAmountBuyer.add(x_requested).toString(),
      "Buyer should have the correct x token amount"
    );

    assert.equal(
      await getTokenAccountBalance(
        provider.connection,
        sellers_y_token.address
      ),
      y_amount.toString(),
      "Seller should have the correct y token amount"
    );

    assert.equal(
      await getAccountBalance(provider.connection, escrowedXTokens),
      new anchor.BN(startAmountVault.toString()).sub(x_requested).toString(),
      "Vault needs to be empty after the 'accept' method is called"
    );
  });

  it("Finds_PDAs_Cancel", async () => {
    escrow = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("escrow"),
        seller.publicKey.toBuffer(),
        anchor.utils.bytes.utf8.encode(productIdCancel),
      ],
      program.programId
    )[0];

    escrowedXTokens = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("escrow"), escrow.toBuffer()],
      program.programId
    )[0];
  });

  it("Init_Cancel", async () => {
    const tx1 = await program.methods
      .initialize(x_amount, y_price, productIdCancel)
      .accounts({
        seller: seller.publicKey,
        xMint: x_mint,
        yMint: y_mint,
        sellersXToken: sellers_x_token.address,
        escrow: escrow,
        escrowedXTokens: escrowedXTokens,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([seller])
      .rpc()
      .then(confirmTx)
      .then(log);

    assert.equal(
      await getAccountBalance(provider.connection, escrowedXTokens),
      x_amount.toString(),
      "Escrow vault account should have the correct deposit amount"
    );
  });

  it("Cancel", async () => {
    const tx3 = await program.methods
      .cancel()
      .accounts({
        seller: seller.publicKey,
        sellersXToken: sellers_x_token.address,
        escrow: escrow,
        escrowedXTokens: escrowedXTokens,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([seller])
      .rpc()
      .then(confirmTx)
      .then(log);
    provider.connection.getBalance;
    assert.equal(
      await getTokenAccountBalance(
        provider.connection,
        sellers_x_token.address
      ),
      new anchor.BN(mint_amount).sub(x_amount).toString(),
      "Sellers needs to get his tokens back after the 'cancel' method is called"
    );
  });
});
