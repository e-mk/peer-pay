import Header from "@/components/header";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const WalletConnectionProvider = dynamic<{ children: ReactNode }>(
  () =>
    import("../components/solanaWallet").then(
      ({ SolanaWallet }) => SolanaWallet
    ),
  {
    ssr: false,
  }
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletConnectionProvider>
      <ToastContainer />
      <Header />
      <Component {...pageProps} />
    </WalletConnectionProvider>
  );
}
