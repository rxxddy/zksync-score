import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { ConnectWallet } from "@thirdweb-dev/react";
import { Link } from "react-router-dom";
import { ethers, providers } from "ethers";
import { useEffect, useState } from 'react';
import { useAddress } from "@thirdweb-dev/react"
import { useBalance } from "@thirdweb-dev/react";
import { NATIVE_TOKEN_ADDRESS } from "@thirdweb-dev/sdk";
import axios from "axios";


const Home: NextPage = () => {
  const address = useAddress()
  const [transactionCount, setTransactionCount] = useState<number>(0);
  const [balance, setBalance] = useState<string>("0");
  const [ensName, setENSName] = useState<string | null>(null);
  const [firstTxDate, setFirstTxDate] = useState<string>("");
  const [walletAge, setWalletAge] = useState<number | null>(null);

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

  useEffect(() => {
    const getBalance = async () => {
      if (address) {
        // const provider = new providers.JsonRpcProvider("https://endpoints.omniatech.io/v1/arbitrum/one/public");
        const provider = new providers.JsonRpcProvider("https://endpoints.omniatech.io/v1/bsc/testnet/public");
        const balance = await provider.getBalance(address);
        const formattedBalance = parseFloat(ethers.utils.formatEther(balance)).toFixed(3);
        setBalance(formattedBalance);
      }
    };
    getBalance();
  }, [address]);

  


  useEffect(() => {
    const getENSName = async () => {
      if (address) {
        // const provider = new providers.JsonRpcProvider("https://endpoints.omniatech.io/v1/arbitrum/one/public");
        const provider = new providers.JsonRpcProvider("https://endpoints.omniatech.io/v1/eth/mainnet/public");
        const name = await provider.lookupAddress(address);
        setENSName(name);
      }
    };
    getENSName();
  }, [address]);

//
  useEffect(() => {
    const getFirstTxDate = async () => {
      if (address) {
        try {
          const response = await axios.get(`https://api-testnet.bscscan.com/api?module=account&action=txlist&address=${address}&sort=asc`);
          const transactions = response.data.result;
          if (transactions.length > 0) {
            const firstTxTimestamp = parseInt(transactions[0].timeStamp);
            const date = new Date(firstTxTimestamp * 1000);
            const options = { day: "numeric", month: "long", year: "numeric" };
            setFirstTxDate(date.toLocaleDateString("en-US", options));
          } else {
            setFirstTxDate("No transactions found");
          }
        } catch (error) {
          console.log(error);
        }
      }
    };
    getFirstTxDate();
  }, [address]);
//




useEffect(() => {
  const getFirstTxDate2 = async () => {
    if (address) {
      try {
        const response = await axios.get(`https://api-testnet.bscscan.com/api?module=account&action=txlist&address=${address}&sort=asc`);
        const transactions = response.data.result;
        if (transactions.length > 0) {
          const firstTxTimestamp = parseInt(transactions[0].timeStamp);
          const firstTxDate = new Date(firstTxTimestamp * 1000);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - firstTxDate.getTime());
          const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
          if (diffMonths <= 3) {
            setWalletAge(1);
          } else if (diffMonths <= 6) {
            setWalletAge(2);
          } else if (diffMonths <= 12) {
            setWalletAge(3);
          } else if (diffMonths <= 24) {
            setWalletAge(4);
          } else if (diffMonths <= 36) {
            setWalletAge(5);
          } else {
            setWalletAge(6);
          }
        } else {
          setWalletAge(null);
        }
      } catch (error) {
        console.log(error);
      }
    }
  };
  getFirstTxDate2();
}, [address]);




  function handleButtonClick() {
    window.location.href = '/';
  }

  function month() {
    console.log(walletAge)
  }

  let Score1 = transactionCount;
  let Score

  if (Score1 <= 1) {
    Score = 1;
  } else if (Score1 >= 10) {
    Score = 10;
  } else {
    Score = Score1;
  }




  return (
    <div>
        <nav className="bg-[#000000]">
            <div className="bg-[#000000] container mx-auto flex items-center h-24 rounded-3xl">
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
                    <button onClick={month} className="p-5 xl:p-8 text-[#d9d9d9] active hover:text-[#ffffff]">
                        Montn
                    </button>
                </ul>
                </nav>
                
                    <ConnectWallet 
                        accentColor="#000000"
                        colorMode="dark"
                        btnTitle="Connect Wallet"
                    />
                
            </div>
        </nav>
        <div className='w-[1800px] m-auto mt-[20vh]'>
          <div className="grid grid-cols-3 gap-8 m-auto">
            <div className="bg-[#252525] h-28 rounded-3xl text-center"><div className='py-5 text-xl text-[#cfc8c8] font-sans font-medium'>Transaction Count: <div className='text-white py-2 text-2xl font-sans font-medium'>{transactionCount}</div></div></div>
            <div className="bg-[#252525] h-28 rounded-3xl text-center"><div className='py-5 text-xl text-[#cfc8c8] font-sans font-medium'>Your Balance: <div className='text-white py-2 text-2xl font-sans font-medium'>{balance}</div></div></div>
            <div className="bg-[#252525] h-28 rounded-3xl text-center"><div className='py-5 text-xl text-[#cfc8c8] font-sans font-medium'>ENS Name: <div className='text-white py-2 text-2xl font-sans font-medium'>{ensName ? ensName : "none"}</div></div></div>
            <div className="col-span-2 border-[#cfc8c8] border-2 h-28 rounded-3xl text-center"><div className='py-5 text-xl text-[#cfc8c8] font-sans font-medium'>Your Score: <div className='text-white py-2 text-2xl font-sans font-medium'>{Score}</div></div></div>
            <div className="bg-[#252525] h-28 rounded-3xl text-center"><div className='py-5 text-xl text-[#cfc8c8] font-sans font-medium'>Wallet Created: <div className='text-white py-2 text-2xl font-sans font-medium'>{firstTxDate}</div></div></div>
            <div className=" bg-[#252525] h-28 rounded-3xl text-center"><div className='py-5 text-xl text-[#cfc8c8] font-sans font-medium'>Transaction Count: <div className='text-white py-2 text-2xl font-sans font-medium'>{transactionCount}</div></div></div>
            <div className="col-span-2 border-[#cfc8c8] border-2 h-28 rounded-3xl text-center"><div className='py-5 text-xl text-[#cfc8c8] font-sans font-medium'>Address: <div className='text-white py-2 text-2xl font-sans font-medium'>{address}</div></div></div>
          </div>
        </div>
    </div>
  )
}

export default Home 