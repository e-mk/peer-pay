import { StaticImageData } from "next/image";

export interface IMint {
  mintAddress: string;
  associatedTokenAddress: string;
  price: number;
}
export interface IMints {
  watch: IMint;
  car: IMint;
  boat: IMint;
}
export enum IMintType {
  watch = "watch",
  car = "car",
  boat = "boat",
}

export interface IProduct {
  title: string;
  price: number;
  image: StaticImageData;
  type: IMintType;
}
