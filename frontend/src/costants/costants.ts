import { PublicKey } from "@solana/web3.js";
import rolex from "../../public/images/rolex.jpg";
import ferrari from "../../public/images/ferrari.jpg";
import yacht from "../../public/images/yacht.jpg";
import { IMintType } from "@/interface/productInterface";

export const USDC_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

export const PRODUCTS = [
  {
    title: "Rolex",
    price: 5000,
    image: rolex,
    type: IMintType.watch,
    mintAmount: 1000000,
  },
  {
    title: "Ferrari",
    price: 200000,
    image: ferrari,
    type: IMintType.car,
    mintAmount: 1000000,
  },
  {
    title: "Yacht",
    price: 500000,
    image: yacht,
    type: IMintType.boat,
    mintAmount: 1000000,
  },
];

export const YPRICE = 1;
