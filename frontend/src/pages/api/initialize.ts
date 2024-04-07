import { NextApiRequest, NextApiResponse } from "next";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  Program,
  Idl,
  BN,
  AnchorProvider,
  utils,
  Wallet,
} from "@project-serum/anchor";
import idl from "../../mm_escrow.json";
import mintData from "../mint.json";
import { USDC_MINT, YPRICE } from "@/costants/costants";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  adminKeypair,
  confirmTx,
  connection,
  findProductByType,
  opts,
  programID,
} from "../utils";

const provider = new AnchorProvider(connection, new Wallet(adminKeypair), opts);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { type }: { type: string } = req.body;
  const program = new Program(idl as Idl, programID, provider);
  const mintJsonData: any = mintData;
  const {
    mintAddress = "",
    associatedTokenAddress = "",
    price = 0,
  } = mintJsonData[type!!] ?? {};
  const { id = "" } = findProductByType(type) ?? {};
  const productId = `${type}-${id}`;

  const escrow = PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode("escrow"),
      adminKeypair.publicKey.toBuffer(),
      utils.bytes.utf8.encode(productId as string),
    ],
    programID
  );

  const escrowedXTokens = PublicKey.findProgramAddressSync(
    [utils.bytes.utf8.encode("escrow"), escrow[0].toBuffer()],
    programID
  );
  const TOKEN_DECIMALS = 1000000;
  const xAmount = new BN((price!! * TOKEN_DECIMALS) / YPRICE);
  try {
    await program.methods
      .initialize(xAmount, new BN(YPRICE), productId)
      .accounts({
        seller: adminKeypair.publicKey,
        xMint: mintAddress,
        yMint: USDC_MINT,
        sellersXToken: associatedTokenAddress,
        escrow: escrow[0],
        escrowedXTokens: escrowedXTokens[0],
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([adminKeypair])
      .rpc()
      .then(confirmTx)
      .catch((error) => {
        res.status(500).json({
          error,
        });
      });
    res.status(200).json({
      done: true,
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
}
