import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { ThirdwebProvider } from "@thirdweb-dev/react";
import Head from "next/head";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./home"
// This is the chainId your dApp will work on.
const activeChain = "mumbai";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    
    <ThirdwebProvider activeChain={activeChain}>
      <Head>
        <title>ZkSync Score</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="ZkSync Score"
        />
        <meta
          name="keywords"
          content="Thirdweb, nft, nftdrop, zksync, retrodrop, arbitrum"
        />
      </Head>
      <Component {...pageProps} />
       
    </ThirdwebProvider>
  );
}

export default MyApp;
