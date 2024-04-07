import {
  PublicKey,
  Keypair,
  Connection,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Ed25519Program,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { Program, Idl, AnchorProvider, utils, BN } from "@project-serum/anchor";
import { showNotification } from "@/utils/showNotification";
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { USDC_MINT, YPRICE } from "@/costants/costants";
import { IMintType, IMints } from "@/interface/productInterface";
import { intToBytes } from "@/utils/utils";
import { adminKeypair, findProductByType, programID } from "@/pages/utils";
import idl from "../mm_escrow.json";
import mintedProducts from "../pages/mint.json";

export const useSolana = ({ buyerWalletPK }: { buyerWalletPK: PublicKey }) => {
  const acceptWallet = async ({
    provider,
    sellerAccept,
    type,
    connection,
    quantity,
  }: {
    provider?: AnchorProvider;
    sellerAccept: Keypair;
    type: IMintType;
    connection: Connection;
    quantity: string;
  }) => {
    const program = new Program(idl as Idl, programID, provider);
    const { id } = findProductByType(type) ?? {};
    const productId = `${type}-${id}`;

    const escrowAccept = PublicKey.findProgramAddressSync(
      [
        utils.bytes.utf8.encode("escrow"),
        sellerAccept.publicKey.toBuffer(),
        utils.bytes.utf8.encode(productId),
      ],
      programID
    );

    const escrowedXTokensAccept = PublicKey.findProgramAddressSync(
      [utils.bytes.utf8.encode("escrow"), escrowAccept[0].toBuffer()],
      programID
    );

    const { mintAddress = "" } = (mintedProducts as IMints)[type!!] ?? {};

    const buyers_token_init = await getOrCreateAssociatedTokenAccount(
      connection,
      sellerAccept,
      new PublicKey(mintAddress),
      buyerWalletPK
    );

    const buyers_usdc_token = await getOrCreateAssociatedTokenAccount(
      connection,
      sellerAccept,
      USDC_MINT,
      buyerWalletPK
    );

    const sellers_usdc_token = await getOrCreateAssociatedTokenAccount(
      connection,
      sellerAccept,
      USDC_MINT,
      sellerAccept.publicKey
    );
    const xRequested = +quantity * 1000000;
    const yAmount = +xRequested * YPRICE;

    try {
      await program.methods
        .accept(new BN(xRequested), new BN(yAmount))
        .accounts({
          escrow: escrowAccept[0],
          escrowedXTokens: escrowedXTokensAccept[0],
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          buyer: buyerWalletPK,
          yMint: USDC_MINT,
          sellersYTokens: sellers_usdc_token.address,
          buyersXTokens: buyers_token_init.address,
          buyersYTokens: buyers_usdc_token.address,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .signers([])
        .rpc();
      showNotification("Payment successfull");
    } catch (error) {
      showNotification((error as { message: string }).message, "error");
    }
  };

  const acceptStripe = async ({
    provider,
    sellerAccept,
    type,
    connection,
    quantity,
    mintedProductsData,
  }: {
    provider?: AnchorProvider;
    sellerAccept: Keypair;
    type: IMintType;
    connection: Connection;
    quantity: string;
    mintedProductsData: any;
  }) => {
    const program = new Program(idl as Idl, programID, provider);
    const { id } = findProductByType(type) ?? {};
    const productId = `${type}-${id}`;

    const escrowAcceptStripe = PublicKey.findProgramAddressSync(
      [
        utils.bytes.utf8.encode("escrow"),
        sellerAccept.publicKey.toBuffer(),
        utils.bytes.utf8.encode(productId),
      ],
      programID
    );
    const escrowedXTokensAcceptStripe = PublicKey.findProgramAddressSync(
      [utils.bytes.utf8.encode("escrow"), escrowAcceptStripe[0].toBuffer()],
      programID
    );

    const { mintAddress = "" } = (mintedProductsData as IMints)[type!!] ?? {};

    const buyers_token_init = await getOrCreateAssociatedTokenAccount(
      connection,
      sellerAccept,
      new PublicKey(mintAddress),
      buyerWalletPK
    );

    const buyers_usdc_token = await getOrCreateAssociatedTokenAccount(
      connection,
      sellerAccept,
      USDC_MINT,
      buyerWalletPK
    );

    const sellers_usdc_token = await getOrCreateAssociatedTokenAccount(
      connection,
      sellerAccept,
      USDC_MINT,
      sellerAccept.publicKey
    );

    const xRequested = +quantity * 1000000;
    const yAmount = +xRequested * YPRICE;
    try {
      const message = intToBytes(yAmount);
      const ed25519Ix = Ed25519Program.createInstructionWithPrivateKey({
        privateKey: adminKeypair.secretKey,
        message,
      });

      const acceptIx = await program.methods
        .accept(new BN(xRequested), new BN(yAmount))
        .accounts({
          escrow: escrowAcceptStripe[0],
          escrowedXTokens: escrowedXTokensAcceptStripe[0],
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          buyer: buyerWalletPK,
          yMint: USDC_MINT,
          sellersYTokens: sellers_usdc_token.address,
          buyersXTokens: buyers_token_init.address,
          buyersYTokens: buyers_usdc_token.address,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .instruction();

      const tx = new Transaction().add(ed25519Ix, acceptIx);
      await provider?.sendAndConfirm(tx, []).catch((e) => console.error(e));
      showNotification("Payment successfull");
      return true;
    } catch (error) {
      showNotification((error as { message: string }).message, "error");
    }
  };

  return { acceptWallet, acceptStripe };
};
