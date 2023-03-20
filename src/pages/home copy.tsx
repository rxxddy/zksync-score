import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { ConnectWallet } from "@thirdweb-dev/react";
import { Link } from "react-router-dom";
import { providers } from "ethers";
import { useEffect, useState } from 'react';
import { useAddress } from "@thirdweb-dev/react"
import { useBalance } from "@thirdweb-dev/react";
import { NATIVE_TOKEN_ADDRESS } from "@thirdweb-dev/sdk";

import * as zksync from 'zksync';
import { Wallet } from 'zksync';
import * as ethers from 'ethers';


const Home: NextPage = () => {
  const address = useAddress()
  const [transactionCount, setTransactionCount] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  
  useEffect(() => {
    const getTransactionCount = async () => {
      if (address) {
        // const provider = new providers.JsonRpcProvider("https://endpoints.omniatech.io/v1/arbitrum/one/public");
        const provider = new providers.JsonRpcProvider("https://endpoints.omniatech.io/v1/bsc/testnet/public");
        const count = await provider.getTransactionCount(address);
        setTransactionCount(count);
      }
    };
    getTransactionCount();
  }, [address]);
  
  function App() {
    const { data, isLoading } = useBalance(NATIVE_TOKEN_ADDRESS);
    console.log(data)
  }

  // start



  // // Committed state is not final yet
  // const committedETHBalance = await syncWallet.getBalance('ETH');

  // // // Verified state is final
  // const verifiedETHBalance = await syncWallet.getBalance('ETH', 'verified');


  // const state = await syncWallet.getAccountState();

  // const committedBalances = state.committed.balances;
  // const committedETHBalance1 = committedBalances['ETH'];
  
  // const verifiedBalances = state.verified.balances;
  // const committedETHBalance2 = verifiedBalances['ETH'];




  // end

  // start1

  async function fetchBalances() {

    const address1 = address;

    const syncProvider = await zksync.getDefaultProvider('goerli');

    const ethersProvider = ethers.getDefaultProvider('goerli');

    // Create ethereum wallet using ethers.js
    const ethWallet = ethers.Wallet.fromMnemonic(MNEMONIC).connect(ethersProvider);

    // Derive zksync.Signer from ethereum wallet.
    const syncWallet = await zksync.Wallet.fromEthSigner(ethWallet, syncProvider);

    const committedETHBalance = await syncWallet.getBalance('ETH');
    const verifiedETHBalance = await syncWallet.getBalance('ETH', 'verified');
    const state = await syncWallet.getAccountState();
    const committedBalances = state.committed.balances;
    const committedETHBalance1 = committedBalances['ETH'];
    const verifiedBalances = state.verified.balances;
    const committedETHBalance2 = verifiedBalances['ETH'];
  }
  
  fetchBalances();

  // end1


  function handleButtonClick() {
    window.location.href = '/';
  }

  return (
    <div>
        <nav className="bg-[#252525]">
            <div className="bg-[#252525] container mx-auto flex items-center h-24 rounded-3xl">
                <button onClick={handleButtonClick} className="flex items-center justify-center">
                    <div className="h-16" />
                    {/* <span className="ml-4 uppercase font-black">clara<br/>thella</span> */}
                    <Image
                      src="/logo.png"
                      alt="thirdweb Logo"
                      width={60}
                      height={60}
                    />
                    <h1 className='text-2xl ml-2 font-sans font-medium'>ZkSync Score</h1>
                </button>
                <nav className="contents font-semibold text-base lg:text-lg">
                <ul className="mx-auto flex items-center">
                    
                    <div className="p-5 xl:p-8 text-[#c1c1c1] active">
                        Home
                    </div>
                    <button onClick={handleButtonClick} className="p-5 xl:p-8 text-[#d9d9d9] active hover:text-[#ffffff]">
                        Mint
                    </button>
                    <button onClick={handleButtonClick} className="p-5 xl:p-8 text-[#d9d9d9] active hover:text-[#ffffff]">
                        About
                    </button>
                    <button onClick={handleButtonClick} className="p-5 xl:p-8 text-[#d9d9d9] active hover:text-[#ffffff]">
                        Whitepaper
                    </button>
                </ul>
                </nav>
                
                    <ConnectWallet 
                        accentColor="#252525"
                        colorMode="dark"
                        btnTitle="Connect Wallet"
                    />
                
            </div>
        </nav>
        <div className="text-center py-10">Transaction Count: {transactionCount}</div>
        <div className="text-center py-10">{address}</div>
    </div>
  )
}

export default Home 