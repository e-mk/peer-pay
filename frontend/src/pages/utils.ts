import {
  PublicKey,
  Keypair,
  Cluster,
  Connection,
  clusterApiUrl,
  Commitment,
} from "@solana/web3.js";
import adminWallet from "../key.json";
import { getProvider } from "@project-serum/anchor";
import mintedData from '../pages/mint.json';

export const confirmTx = async (signature: string): Promise<string> => {
  const block = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature,
    ...block,
  });
  return signature;
};

export const logTx = async (signature: string): Promise<string> => {
  console.log(
    `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${
      getProvider().connection.rpcEndpoint
    }`
  );
  return signature.toString();
};

export const adminKeypair = Keypair.fromSecretKey(new Uint8Array(adminWallet));

export const programID = new PublicKey(
  process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID as string
);

export const opts = {
  preflightCommitment: "processed" as Commitment,
};

export const connection = new Connection(
  clusterApiUrl(process.env.NEXT_PUBLIC_SOLANA as Cluster),
  "confirmed"
);

export const findProductByType = (type: string) => {
  return mintedData[type as keyof typeof mintedData];
}
