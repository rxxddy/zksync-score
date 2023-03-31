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
import * as zksync from "zksync";
import { PieChart } from 'react-minimal-pie-chart';
import { ethers as eth } from 'ethers';
import { Provider, Wallet  } from 'zksync';
import { getDefaultProvider } from "zksync";



const Home: NextPage = () => {
  const address = useAddress() || "";



// Define the user's wallet address and NFT ID
const userAddress = '0x...'; // Replace with the user's wallet address
const nftId = 123; // Replace with the ID of the NFT you're checking for

// Define the contract address and token set for the NFT
const contractAddress = '0x...'; // Replace with the address of the NFT contract on zkSync
const tokenSet = 'ETHNFT'; // Replace with the token set for the NFT (e.g. 'ETHNFT' or 'NFT')

// Initialize the provider object with the network you want to check
const network = 'rinkeby'; // Replace with the network you want to check
const provider = Provider.newHttpProvider(`https://${network}-api.zksync.io/jsrpc`);

// Initialize the ethers provider object with the same network
const ethersProvider = new ethers.providers.JsonRpcProvider(`https://${network}-rinkeby.infura.io/v3/<your-project-id>`);

// Get the balance of the specified token set for the user's address
provider.then(provider => {
  provider.getState(userAddress).then(state => {
    const tokenState = state.committed.balances[tokenSet];
    // Check if the user owns the NFT with the specified ID
    if (tokenState && tokenState[contractAddress] && tokenState[contractAddress][ethers.BigNumber.from(nftId).toHexString()]) {
      // If the user owns the NFT, redirect to another page
      window.location.href = 'https://example.com/redirect'; // Replace with the URL of the page you want to redirect to
    }
  }).catch(error => {
    console.log(error);
  });
}).catch(error => {
  console.log(error);
});


  // const address = "0xce20d01E96710885Db68ecd7cDd2423293f15130";
  // const address = `0x705306Ac819EA86e717e1e180251799EBfac95e1` || "";
  const [transactionCount, setTransactionCount] = useState<number>(0);
  const [balance, setBalance] = useState<string>(`0`);
  const [ensName, setENSName] = useState<string | null>(null);
  const [firstTxDate, setFirstTxDate] = useState<string>("");
  const [walletAge, setWalletAge] = useState<number | null>(null);
  const [erc20Count, setErc20Count] = useState<number | null>(null);

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

  useEffect(() => {
    const getTransactionCount = async () => {
      if (address) {
        const provider = new providers.JsonRpcProvider("https://mainnet.era.zksync.io");
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
        const provider = new providers.JsonRpcProvider("https://mainnet.era.zksync.io");
        const balance = await provider.getBalance(address);
        const formattedBalance = parseFloat(ethers.utils.formatEther(balance)).toFixed(3);
        setBalance(formattedBalance);
      }
    };
    getBalance();
  }, [address]);

  //

  // useEffect(() => {
  //   const getBalance = async () => {
  //     if (address) {
  //       const provider = await zksync.getDefaultProvider("mainnet");
  //       const ethersProvider = new ethers.providers.JsonRpcProvider("https://zksync.api.vitalik.ca");
  //       const ethersSigner = ethersProvider.getSigner();
  //       const wallet = await zksync.Wallet.fromEthSigner(ethersSigner, provider);
  //       const accountState = await wallet.getAccountState();
  //       const balance = parseFloat(ethers.utils.formatEther(accountState.verified.balances[0])).toFixed(3);
  //       setBalance(balance);
  //     }
  //   };
  //   getBalance();
  // }, [address]);



  // const ZKSYNC_RPC_ENDPOINT = "https://api.zksync.io/jsrpc";

  // useEffect(() => {
  //   async function fetchBalance() {
  //     if (!address) {
  //       setBalance(`null`);
  //       return;
  //     }

  //     const zksyncProvider = getDefaultProvider("mainnet");
  //     const ethersProvider = new ethers.providers.JsonRpcProvider(
  //       ZKSYNC_RPC_ENDPOINT
  //     );
  //     const ethersSigner = ethersProvider.getSigner();
  //     const wallet = await Wallet.fromEthSigner(ethersSigner, await zksyncProvider);
  //     const accountState = await wallet.getAccountState();
  //     const formattedBalance = parseFloat(
  //       ethers.utils.formatEther(accountState.committed.balances[0])
  //     ).toFixed(3);
  //     setBalance(formattedBalance);
  //   }

  //   fetchBalance();
  // }, [address]);


//
useEffect(() => {
  const getFirstTxDate = async () => {
    if (address) {
      try {
        const response = await axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=asc`);
        const transactions = response.data.result;
        if (transactions.length > 0) {
          const firstTxTimestamp = parseInt(transactions[0].timeStamp);
          const date = new Date(firstTxTimestamp * 1000);
          const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
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
        const response = await axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=asc`);
        const transactions = response.data.result;
        if (transactions.length > 0) {
          const firstTxTimestamp = parseInt(transactions[0].timeStamp);
          const firstTxDate = new Date(firstTxTimestamp * 1000);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - firstTxDate.getTime());
          const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
          if (diffMonths <= 1) {
            setWalletAge(0);
          } else if (diffMonths <= 3) {
            setWalletAge(5);
          } else if (diffMonths <= 6) {
            setWalletAge(10);
          } else if (diffMonths <= 12) {
            setWalletAge(15);
          } else if (diffMonths <= 24) {
            setWalletAge(20);
          } else if (diffMonths <= 36) {
            setWalletAge(25);
          } else {
            setWalletAge(30);
          }
        } else {
          setWalletAge(30);
        }
      } catch (error) {
        console.log(error);
      }
    }
  };
  getFirstTxDate2();
}, [address]);




// useEffect(() => {
//   const getErc20Count = async () => {
//     if (address) {
//       try {
//         const response = await axios.get(`https://api.bscscan.com/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=999999999&sort=asc&apikey=AU7VYBH19E4T8K1Z1BTKTNIR8PGN75W9DJ`);
//         const erc20Transactions = response.data.result;
//         const uniqueTokenAddresses = new Set<string>();

//         erc20Transactions.forEach((tx: any) => {
//           uniqueTokenAddresses.add(tx.contractAddress);
//         });

//         setErc20Count(uniqueTokenAddresses.size);
//       } catch (error) {
//         console.log(error);
//       }
//     }
//   };

//   getErc20Count();
// }, [address]);

useEffect(() => {
  const getErc20Count = async () => {
    if (address) {
      try {
        const response = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=999999999&sort=asc&apikey=1BGF5CS76YB6SCD7Y7BEGX1IC3DB7K2H5E`);
        const erc20Transactions = response.data.result;
        const uniqueTokenAddresses = new Set<string>();
        erc20Transactions.forEach((tx: any) => {
          uniqueTokenAddresses.add(tx.contractAddress);
        });
        setErc20Count(uniqueTokenAddresses.size);
      } catch (error) {
        console.log(error);
      }
    }
  };
  getErc20Count();
}, [address]);




// useEffect(() => {
//   async function fetchBalance() {
//     if (!address) {
//       console.error("Invalid Ethereum address:", address);
//       return;
//     }
//     const syncProvider = getDefaultProvider("mainnet");
//     const provider = new ethers.providers.Web3Provider(window.ethereum as any);
//     const signer = provider.getSigner(address);
//     const wallet = await zksync.Wallet.fromEthSigner(signer, await syncProvider);

//     const balance = await wallet.getBalance('ETH');
//     setBalance(balance.toString());
//   }
//   fetchBalance();
// }, [address]);





// function handleButtonClick() {
//   window.location.href = '/';
// }
function handleButtonClick2() {
  window.location.href = '/';
}

  function month() {
    console.log(walletAge)
  }

  let txCount = transactionCount;
  let txScore = 0;

  if (txCount <= 1) {
    txScore = 0;
  } else if (txCount <= 10) {
    txScore = 1;
  } else if (txCount <= 100) {
    txScore = 5;
  } else if (txCount <= 500) {
    txScore = 10;
  } else if (txCount <= 1000) {
    txScore = 15;
  } else {
    txScore = 15;
  }

  let ensCount = ensName;
  let ensScore = 0;

  if (ensCount == null) {
    ensScore = 0;
  } else {
    ensScore = 5;
  }


  let tokensCount = erc20Count ?? 0; // Use 0 as the default value if erc20Count is null or undefined
  let tokensScore = 0;

  if (tokensCount <= 5) {
    tokensScore = 1;
  } else if (tokensCount <= 10) {
    tokensScore = 10;
  } else if (tokensCount <= 50) {
    tokensScore = 15;
  } else if (tokensCount <= 100) {
    tokensScore = 20;
  } else {
    tokensScore = 25;
  }

  let balanceCount = parseFloat(balance);
  let balanceScore = 0;
  
  if (balanceCount <= 0) {
    balanceScore = 0;
  } else if (balanceCount <= 0.1) {
    balanceScore = 1;
  } else if (balanceCount <= 0.5) {
    balanceScore = 5;
  } else if (balanceCount <= 1) {
    balanceScore = 10;
  } else if (balanceCount <= 10) {
    balanceScore = 15;
  } else if (balanceCount <= 100) {
    balanceScore = 20;
  } else {
    balanceScore = 25;
  }

  let walletCount = walletAge || 0;

  let Score = tokensScore + txScore + walletCount + ensScore + balanceScore


  function getConsoleInfo() {
    console.log("tokensScore");
    console.log(tokensScore);
    console.log("txScore");
    console.log(txScore);
    console.log("walletAge");
    console.log(walletAge);
    console.log("ensScore");
    console.log(ensScore);
    console.log("balanceScore");
    console.log(balanceScore);
  }


  

  const options2 = {
    value: Score / 100,
    label: 'NPS',
    showMinMax: false,
    gaugeColor: '#ddd',
    levelColors: ['#d9534f', '#f0ad4e', '#5cb85c'],
    customSectors: [
      {
        color: '#d9534f',
        lo: -1,
        hi: -0.1,
      },
      {
        color: '#f0ad4e',
        lo: -0.1,
        hi: 0.1,
      },
      {
        color: '#5cb85c',
        lo: 0.1,
        hi: 1,
      },
    ],
    style: { width: '200px', height: '200px', margin: 'auto' },
  };

  const data = [{ value: Score, color: getColor(Score) }];
  const totalValue = 100;



  function getColor(Score: number) {
    if (Score >= 0 && Score <= 20) {
      return "#FF0000"; // red
    } else if (Score > 20 && Score <= 40) {
      return "#FFA500"; // orange
    } else if (Score > 40 && Score <= 60) {
      return "#ffe043"; // yellow
    } else if (Score > 60 && Score <= 80) {
      return "#90EE90"; // light green
    } else if (Score > 80 && Score <= 90) {
      return "#008000"; // green
    } else if (Score > 90 && Score <= 100) {
      return "#800080"; // purple
    } else {
      return "#000000"; // black
    }
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuClick = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  function handleButtonClick() {
    setIsMobileMenuOpen(false);
    window.location.href = '/home';
  }

  const shortenedAddress = address.length > 8 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address;


  return (
    <div>
        <nav className="backdrop-blur-2xl">
          <div className=" container mx-auto flex items-center h-24 rounded-3xl justify-between">
              <button onClick={handleButtonClick} className="ml-4 flex items-center justify-center">

                  <Image
                    src="/logo.png"
                    alt="thirdweb Logo"
                    width={60}
                    height={60}
                    
                  />
                  <h1 className='text-2xl ml-2 font-sans font-medium'>ZkSync Score</h1>
              </button>
              
              <nav className="contents font-semibold text-base lg:text-lg">
                <div className="flex justify-between items-center md:hidden">
                  <button
                    onClick={handleMobileMenuClick}
                    className="p-5 xl:p-8 text-[#d9d9d9] active hover:text-[#ffffff]"
                  >
                    Menu
                  </button>
                </div>
                <ul className="mx-auto hidden md:flex items-center">
                  <li>
                    <button
                      onClick={handleButtonClick}
                      className="p-5 xl:p-8 text-[#d9d9d9] active hover:text-[#ffffff]"
                    >
                      Home
                    </button>
                    
                  </li>
                  <li>
                    <button onClick={handleButtonClick2} className="p-5 xl:p-8 text-[#c1c1c1] active ">Mint</button>
                  </li>
                  <li>
                    <button onClick={getConsoleInfo} className="p-5 xl:p-8 text-[#c1c1c1] active ">getConsoleInfo</button>
                  </li>
                </ul>
                {isMobileMenuOpen && (
                  <ul
                    className="md:hidden absolute top-16 inset-x-0 bg-[#a9a9a9] z-50 w-[70%] m-auto rounded-xl mt-5"
                    style={{ transform: "translateY(0%)" }}
                  >
                    <li>
                      <button
                        onClick={handleButtonClick}
                        className="block w-full py-3 text-center text-[#000000] hover:text-[#ffffff] p-4"
                      >
                        Home
                      </button>
                    </li>
                    <li>
                      <button onClick={handleButtonClick2} className="block w-full py-3 text-center text-[#000000]">
                        Mint
                      </button>
                    </li>
                    <li>
                      <ConnectWallet
                        accentColor="#a9a9a9"
                        colorMode="dark"
                        btnTitle="Connect Wallet"
                      />
                    </li>
                  </ul>
                )}
                <div className="hidden md:block">
                  <ConnectWallet
                        accentColor="black"
                        colorMode="dark"
                        btnTitle="Connect Wallet"
                  />
                </div>
              </nav>
              
          </div>
      </nav>
        <div className='w-[100%] m-auto mt-[8%] p-10 block sm:hidden'>
          <h1 className='text-3xl flex justify-center m-auto mb-8'>Your Score:</h1>
          <PieChart
            data={data}
            totalValue={200}
            lineWidth={20}
            label={({ dataEntry }) => dataEntry.value}
            labelStyle={{
              fontSize: '25px',
              fontFamily: 'sans-serif',
              fill: 'white',
            }}
            labelPosition={0}
            startAngle={180}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:hidden px-4 pb-8">
            <div className="border-[#cfc8c8] border-2 h-28 rounded-3xl text-center"><div className='py-5 text-[1.5vh] text-[#cfc8c8] font-sans font-medium'>Address: <div className='text-white py-2 text-[2vh] font-sans font-medium'>{shortenedAddress}</div></div></div>
            <div className="bg-[#252525] h-28 rounded-3xl text-center"><div className='py-5 text-[1.5vh] text-[#cfc8c8] font-sans font-medium'>Transaction Count: <div className='text-white py-2 text-[2vh] font-sans font-medium'>{transactionCount}</div></div></div>
            <div className="bg-[#252525] h-28 rounded-3xl text-center"><div className='py-5 text-[1.5vh] text-[#cfc8c8] font-sans font-medium'>Your Balance: <div className='text-white py-2 text-[2vh] font-sans font-medium'>{balance}</div></div></div>
            <div className="bg-[#252525] h-28 rounded-3xl text-center"><div className='py-5 text-[1.5vh] text-[#cfc8c8] font-sans font-medium'>ENS Name: <div className='text-white py-2 text-[2vh] font-sans font-medium'>{ensName ? ensName : "none"}</div></div></div>
            {/* <div className=" border-[#cfc8c8] border-2 h-28 rounded-3xl text-center"><div className='py-5 text-[1.5vh] text-[#cfc8c8] font-sans font-medium'>Your Score: <div className='text-white py-2 text-[2vh] font-sans font-medium'>{Score}</div></div></div> */}
            <div className="bg-[#252525] h-28 rounded-3xl text-center"><div className='py-5 text-[1.5vh] text-[#cfc8c8] font-sans font-medium'>Wallet Created: <div className='text-white py-2 text-[2vh] font-sans font-medium'>{firstTxDate}</div></div></div>
            <div className=" bg-[#252525] h-28 rounded-3xl text-center"><div className='py-5 text-[1.5vh] text-[#cfc8c8] font-sans font-medium'>Number of Tokens: <div className='text-white py-2 text-[2vh] font-sans font-medium'>{erc20Count}</div></div></div>
            
        </div>
        <div className='w-[90%] max-w-screen-2xl m-auto mt-[8%] p-10 hidden sm:block'>
          <div className="grid grid-cols-3 gap-8 m-auto">
            <div className="bg-[#252525] h-28 rounded-3xl text-center"><div className='py-5 text-[1.5vh] text-[#cfc8c8] font-sans font-medium'>Transaction Count: <div className='text-white py-2 text-[2vh] font-sans font-medium'>{transactionCount}</div></div></div>
            <div className="bg-[#252525] h-28 rounded-3xl text-center"><div className='py-5 text-[1.5vh] text-[#cfc8c8] font-sans font-medium'>Your Balance: <div className='text-white py-2 text-[2vh] font-sans font-medium'>{balance}</div></div></div>
            <div className="bg-[#252525] h-28 rounded-3xl text-center"><div className='py-5 text-[1.5vh] text-[#cfc8c8] font-sans font-medium'>ENS Name: <div className='text-white py-2 text-[2vh] font-sans font-medium'>{ensName ? ensName : "none"}</div></div></div>
            <div className="col-span-2 border-[#cfc8c8] border-2 h-28 rounded-3xl text-center"><div className='py-5 text-[1.5vh] text-[#cfc8c8] font-sans font-medium'>Your Score: <div className='text-white py-2 text-[2vh] font-sans font-medium'>{Score}</div></div></div>
            <div className="bg-[#252525] h-28 rounded-3xl text-center"><div className='py-5 text-[1.5vh] text-[#cfc8c8] font-sans font-medium'>Wallet Created: <div className='text-white py-2 text-[2vh] font-sans font-medium'>{firstTxDate}</div></div></div>
            <div className=" bg-[#252525] h-28 rounded-3xl text-center"><div className='py-5 text-[1.5vh] text-[#cfc8c8] font-sans font-medium'>Number of Tokens: <div className='text-white py-2 text-[2vh] font-sans font-medium'>{erc20Count}</div></div></div>
            <div className="col-span-2 border-[#cfc8c8] border-2 h-28 rounded-3xl text-center"><div className='py-5 text-[1.5vh] text-[#cfc8c8] font-sans font-medium'>Address: <div className='text-white py-2 text-[2vh] font-sans font-medium'>{shortenedAddress}</div></div></div>
          </div>
        </div>

    </div>
  )
}

export default Home 