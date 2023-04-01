import Head from 'next/head'
import Image from 'next/image'
// import { Inter } from 'next/font/google'
import styles from '@/styles/Theme.module.css'
import { useEffect } from 'react';
import { ethers } from 'ethers';
import { ConnectWallet } from "@thirdweb-dev/react";
import { Link } from "react-router-dom";

import ReactPlayer from 'react-player';

import {
  useActiveClaimConditionForWallet,
  useAddress,
  useClaimConditions,
  useClaimerProofs,
  useClaimIneligibilityReasons,
  useContract,
  useContractMetadata,
  useTotalCirculatingSupply,
  Web3Button,
} from "@thirdweb-dev/react";
import { BigNumber, utils } from "ethers";
import type { NextPage } from "next";
import { useMemo, useState } from "react";
import { parseIneligibility } from "../utils/parseIneligibility";
import Logo from "../../public/logo.png"
import { BrowserRouter } from 'react-router-dom';

import YouTube from 'react-youtube'; // assuming you have installed react-youtube
// Put Your Edition Drop Contract address from the dashboard here
const myEditionDropContractAddress =
  "0xaA9227cb66Cdb0c1602f43E4d1bc1892f8704707";

// Put your token ID here
const tokenId = 0;

type Props = {
  provider: ethers.providers.Web3Provider
}

const Home: NextPage = () => {
  const address = useAddress();
  const [quantity, setQuantity] = useState(1);
  const { contract: editionDrop } = useContract(myEditionDropContractAddress);
  const { data: contractMetadata } = useContractMetadata(editionDrop);

  const claimConditions = useClaimConditions(editionDrop);
  const activeClaimCondition = useActiveClaimConditionForWallet(
    editionDrop,
    address,
    tokenId
  );
  const claimerProofs = useClaimerProofs(editionDrop, address || "", tokenId);
  const claimIneligibilityReasons = useClaimIneligibilityReasons(
    editionDrop,
    {
      quantity,
      walletAddress: address || "",
    },
    tokenId
  );

  const claimedSupply = useTotalCirculatingSupply(editionDrop, tokenId);

  const totalAvailableSupply = useMemo(() => {
    try {
      return BigNumber.from(activeClaimCondition.data?.availableSupply || 0);
    } catch {
      return BigNumber.from(1_000_000);
    }
  }, [activeClaimCondition.data?.availableSupply]);

  const numberClaimed = useMemo(() => {
    return BigNumber.from(claimedSupply.data || 0).toString();
  }, [claimedSupply]);

  const numberTotal = useMemo(() => {
    const n = totalAvailableSupply.add(BigNumber.from(claimedSupply.data || 0));
    if (n.gte(1_000_000)) {
      return "";
    }
    return n.toString();
  }, [totalAvailableSupply, claimedSupply]);

  const priceToMint = useMemo(() => {
    const bnPrice = BigNumber.from(
      activeClaimCondition.data?.currencyMetadata.value || 0
    );
    return `${utils.formatUnits(
      bnPrice.mul(quantity).toString(),
      activeClaimCondition.data?.currencyMetadata.decimals || 18
    )} ${activeClaimCondition.data?.currencyMetadata.symbol}`;
  }, [
    activeClaimCondition.data?.currencyMetadata.decimals,
    activeClaimCondition.data?.currencyMetadata.symbol,
    activeClaimCondition.data?.currencyMetadata.value,
    quantity,
  ]);

  const maxClaimable = useMemo(() => {
    let bnMaxClaimable;
    try {
      bnMaxClaimable = BigNumber.from(
        activeClaimCondition.data?.maxClaimableSupply || 0
      );
    } catch (e) {
      bnMaxClaimable = BigNumber.from(1_000_000);
    }

    let perTransactionClaimable;
    try {
      perTransactionClaimable = BigNumber.from(
        activeClaimCondition.data?.maxClaimablePerWallet || 0
      );
    } catch (e) {
      perTransactionClaimable = BigNumber.from(1_000_000);
    }

    if (perTransactionClaimable.lte(bnMaxClaimable)) {
      bnMaxClaimable = perTransactionClaimable;
    }

    const snapshotClaimable = claimerProofs.data?.maxClaimable;

    if (snapshotClaimable) {
      if (snapshotClaimable === "0") {
        // allowed unlimited for the snapshot
        bnMaxClaimable = BigNumber.from(1_000_000);
      } else {
        try {
          bnMaxClaimable = BigNumber.from(snapshotClaimable);
        } catch (e) {
          // fall back to default case
        }
      }
    }

    let max;
    if (totalAvailableSupply.lt(bnMaxClaimable)) {
      max = totalAvailableSupply;
    } else {
      max = bnMaxClaimable;
    }

    if (max.gte(1_000_000)) {
      return 1_000_000;
    }
    return max.toNumber();
  }, [
    claimerProofs.data?.maxClaimable,
    totalAvailableSupply,
    activeClaimCondition.data?.maxClaimableSupply,
    activeClaimCondition.data?.maxClaimablePerWallet,
  ]);

  const isSoldOut = useMemo(() => {
    try {
      return (
        (activeClaimCondition.isSuccess &&
          BigNumber.from(activeClaimCondition.data?.availableSupply || 0).lte(
            0
          )) ||
        numberClaimed === numberTotal
      );
    } catch (e) {
      return false;
    }
  }, [
    activeClaimCondition.data?.availableSupply,
    activeClaimCondition.isSuccess,
    numberClaimed,
    numberTotal,
  ]);

  const canClaim = useMemo(() => {
    return (
      activeClaimCondition.isSuccess &&
      claimIneligibilityReasons.isSuccess &&
      claimIneligibilityReasons.data?.length === 0
    );
  }, [activeClaimCondition.isSuccess, claimIneligibilityReasons.isSuccess, claimIneligibilityReasons.data?.length]);

  const isLoading = useMemo(() => {
    return (
      activeClaimCondition.isLoading || claimedSupply.isLoading || !editionDrop
    );
  }, [activeClaimCondition.isLoading, editionDrop, claimedSupply.isLoading]);

  const buttonLoading = useMemo(
    () => isLoading || claimIneligibilityReasons.isLoading,
    [claimIneligibilityReasons.isLoading, isLoading]
  );
  const buttonText = useMemo(() => {
    if (isSoldOut) {
      return "Sold Out";
    }

    if (canClaim) {
      const pricePerToken = BigNumber.from(
        activeClaimCondition.data?.currencyMetadata.value || 0
      );
      if (pricePerToken.eq(0)) {
        return "Buy Now";
      }
      // return `Buy For (${priceToMint})`;
      return `Buy Now`;
    }
    if (claimIneligibilityReasons.data?.length) {
      return parseIneligibility(claimIneligibilityReasons.data, quantity);
    }
    if (buttonLoading) {
      return "Checking eligibility...";
    }

    return "Claiming not available";
  }, [
    isSoldOut,
    canClaim,
    claimIneligibilityReasons.data,
    buttonLoading,
    activeClaimCondition.data?.currencyMetadata.value,
    priceToMint,
    quantity,
  ]);



  // function handleButtonClick() {
  //   window.location.href = '/home';
  // }
  function handleButtonClick2() {
    window.location.href = '/';
  }
  function zksyncTwitter() {
    window.location.href = 'https://twitter.com/zksync';
  }
  function zksyncWebsite() {
    window.location.href = 'https://zksync.io/';
  }
  function zksyncBridge() {
    window.location.href = 'https://portal.zksync.io/bridge';
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuClick = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };


  function handleButtonClick() {
    setIsMobileMenuOpen(false);
    window.location.href = '/home';
  }
    const imageUrls = ['https://cdn.dribbble.com/userupload/4273517/file/original-e4fb03026d39fa03ee5a0c5566a0037c.png?compress=1&resize=1024x768', 'https://cdn.dribbble.com/userupload/4961410/file/original-8e18fc65f46cc8b8e1fac33cbc8cbf07.png?compress=1&resize=1024x768', 'https://cdn.dribbble.com/userupload/4090855/file/original-5de98f2a2e258a6f5e16557ba48b0dde.png?compress=1&resize=640x480&vertical=top', 'https://cdn.dribbble.com/users/1630608/screenshots/16434312/media/5acb5ce6772c8c7fce6a00d7c0c4f22a.png?compress=1&resize=400x300&vertical=top', 'https://cdn.dribbble.com/users/1630608/screenshots/15232840/media/d3379466ff8fd2f1ba625fd4f2421c9c.png?compress=1&resize=400x300&vertical=top', 'https://cdn.dribbble.com/users/1630608/screenshots/15029535/media/8c0166aa9917922a481649d34601670a.png?compress=1&resize=400x300&vertical=top', 'https://cdn.dribbble.com/users/1630608/screenshots/14748675/comp_1_1.png?compress=1&resize=400x300&vertical=top'];
    const imageUrlsHidden = ['https://img.freepik.com/free-vector/padlock-coloured-outline_78370-548.jpg', 'https://img.freepik.com/free-vector/padlock-coloured-outline_78370-548.jpg', 'https://img.freepik.com/free-vector/padlock-coloured-outline_78370-548.jpg', 'https://img.freepik.com/free-vector/padlock-coloured-outline_78370-548.jpg', 'https://img.freepik.com/free-vector/padlock-coloured-outline_78370-548.jpg', 'https://img.freepik.com/free-vector/padlock-coloured-outline_78370-548.jpg'];

    const like = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Facebook_like_thumb.png/1196px-Facebook_like_thumb.png';

    const videoIds = ['QMUii9fSKfQ', 'Ov3Z3vD5zFw', '1LkOa7Ky2ak', 'Ov3Z3vD5zFw', 'QMUii9fSKfQ', 'Ov3Z3vD5zFw', '1LkOa7Ky2ak'];
  
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const handleImageClick = (index: number) => {
      setSelectedImageIndex(index);
    };


    const nftContractAddress = '0xaA9227cb66Cdb0c1602f43E4d1bc1892f8704707';
    const nftId = 0;
  
    const [hasNft, setHasNft] = useState(false);

    useEffect(() => {
      const checkNftBalance = async () => {
        try {
          const provider = new ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com');
          const nftContract = new ethers.Contract(nftContractAddress, ['function balanceOf(address,uint256) view returns (uint256)'], provider);
  
          // Replace `USER_ADDRESS` with the user's address you want to check
          if (address !== undefined) {
            const userAddress = address;
            const nftBalance = await nftContract.balanceOf(userAddress, nftId);
            setHasNft(nftBalance > 0);
          }
        } catch (error) {
          console.log('Error checking NFT balance:', error);
        }
      };
  
      checkNftBalance();
    }, [address]);

    // console.log(address)


    // const [hasNFT, setHasNFT] = useState<boolean>(false);
    // const [CheckBalance, setCheckBalance] = useState<number>(0);

    // const checkNFT = async () => {
    //   try {
    //     const provider = new ethers.providers.JsonRpcProvider('https://endpoints.omniatech.io/v1/matic/mumbai/public');
    //     const contractAddress = '0xaA9227cb66Cdb0c1602f43E4d1bc1892f8704707';
    //     const contractABI = [
    //       'function balanceOf(address, uint256) view returns (uint256)'
    //     ]
    //     const contract = new ethers.Contract(contractAddress, contractABI, provider);
    //     const userAddress = address; // Replace with the user's Ethereum address
    //     const balance = await contract.balanceOf(userAddress);
    //     setHasNFT(balance > 0);
    //     setCheckBalance(balance)
    //   } catch (error) {
    //     console.error(error);
    //   }
    // };
    // const balanceCheck = () => {
    //   console.log(CheckBalance)
    // };


  return (
    <div>

      <nav className="backdrop-blur-2xl">
          <div className=" container mx-auto flex items-center h-24 rounded-3xl justify-between">
              <button onClick={handleButtonClick} className="ml-4 flex items-center justify-center">

                  <Image
                    src="/logo.png"
                    alt="thirdweb Logo"
                    width={70}
                    height={60}
                    
                  />
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
                    colorMode="light"
                    btnTitle="Connect Wallet"
                  />
                </div>
              </nav>
              
          </div>
      </nav>

      <div className={styles.container}>
        <div className={styles.mintInfoContainer}> 
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>

              <div>

                 {hasNft ? (
                   <div className="grid grid-cols-[8fr,2fr] w-full">
                      <div className="bg-gray-100 h-[50em] w-full">
                        {selectedImageIndex !== null && (
                          <ReactPlayer
                            url={`https://www.youtube.com/watch?v=${videoIds[selectedImageIndex]}`}
                            width='100%'
                            height='100%'
                          />
                        )}
                      </div>
      
                      <div className="bg-transparent h-[50em] w-full">
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            overflow: 'scroll',
                            height: '50em',
                            width: '100%',
                            marginLeft: '2em',
                          }}
                        >
                          {imageUrls.map((imageUrl, index) => (
                            <img
                              key={imageUrl}
                              src={imageUrl}
                              alt="placeholder"
                              style={{ marginBottom: '2rem', width: '80%', cursor: 'pointer' }}
                              onClick={() => handleImageClick(index)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                 ) : (
                  <div className="grid grid-cols-[8fr,2fr] w-full">
                      <div className="bg-gray-100 h-[50em] w-full">
                      <ReactPlayer
                            url={`https://www.youtube.com/watch?v=eAMCcnxXLhM`}
                            width='100%'
                            height='100%'
                          />
                      </div>
      
                      <div className="bg-transparent h-[50em] w-full">
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            overflow: 'scroll',
                            height: '50em',
                            width: '100%',
                            marginLeft: '2em',
                          }}
                        >
                          {imageUrlsHidden.map((imageUrl, index) => (
                            <img
                              key={imageUrl}
                              src={imageUrl}
                              alt="placeholder"
                              style={{ marginBottom: '2rem', width: '80%', cursor: 'pointer' }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                 )}
                <div className="grid grid-cols-[8fr,2fr] w-full">
                  <div>
                    {/*  */}
                    <div>
                      
                      <div>
                        <p className='mt-10 w-full text-3xl font-mono'>React Native Complete Guide 2023: Zero to Mastery</p>
                        <p className='mt-10 w-full text-xl font-mono'>Everything about React Native - build cross-platform enterprise apps, incl. Hooks, Redux, Firebase, Rest API, Publishing</p>
                      </div>    
                    </div>
                    {hasNft ? (
                      
                      <p></p>
                    ) : (
                      <div className="grid  w-full">
                        <div className='mt-10 w-full h-20 bg-[#515151] rounded-full items-center flex '>
                          <div className='w-[20%] p-4 bg-indigo-500 hover:bg-transparent rounded-full h-14 ml-4 flex items-center justify-center cursor-pointer'>
                            <p className='text-[2vh] font-mono'>Add To Cart</p>
                          </div>
                          
                            {/* <p className='text-[2vh] font-mono'>Buy Now</p> */}
                            <Web3Button
                              contractAddress={editionDrop?.getAddress() || ""}
                              action={(cntr) => cntr.erc1155.claim(tokenId, quantity)}
                              isDisabled={!canClaim || buttonLoading}
                              onError={(err) => {
                                console.error(err);
                                alert("Error claiming NFTs");
                              }}
                              onSuccess={() => {
                                setQuantity(1);
                                alert("Successfully claimed NFTs");
                              }}
                              className='text-[2vh] font-mono bg-transparent w-[20%] p-4 border-[#252525] hover:bg-sky-700 border-2 rounded-full h-14 ml-8 flex items-center justify-center cursor-pointer font-thin'
                            >
                              {buttonLoading ? "Loading..." : buttonText}
                            </Web3Button>
                          
                          <div className='w-[10%] p-4 rounded-full h-14 ml-8 flex items-center justify-center'>
                              <img
                                key={like}
                                src={like}
                                alt="placeholder"
                                style={{ width: '50%', cursor: 'pointer' }}
                              />
                          </div>
                          <div className='w-[50%] p-4 h-14 ml-8 flex items-center justify-end cursor-pointer'>
                            <p className='text-2xl font-mono mr-4'>$16.99 USDC</p>
                          </div>
                        </div>   
                      </div>
                    )}
                    <div className="grid  w-full">
                      <div className="grid grid-cols-[5fr,5fr] w-full mt-10 mb-10 bg-[#2B2B2B] rounded-3xl">
                        <div className='p-10'>
                          <p className='leading-10 w-full text-xl font-mono'>
                            - introduction introduction introduction  <br />
                            - Tools Tools Tools Tools Tools Tools Tools Tools <br />
                            - App Tools Tools Tools Tools Tools Tools <br />
                            - basicsTools Tools Tools Tools Tools Tools <br />
                            - Main ScreenTools Tools Tools Tools Tools Tools <br />
                            - NavigationTools Tools Tools Tools Tools Tools <br />
                            - LibrariesScreenTools Tools Tools Tools Tools <br />
                            - ExpoScreenTools Tools Tools Tools Tools <br />
                          </p>
                        </div>    
                        <div className='p-10'>
                          <p className='leading-10 w-full text-xl font-mono'>
                            - introduction introduction introduction  <br />
                            - Tools Tools Tools Tools Tools Tools Tools Tools <br />
                            - App Tools Tools Tools Tools Tools Tools <br />
                            - basicsTools Tools Tools Tools Tools Tools <br />
                            - Main ScreenTools Tools Tools Tools Tools Tools <br />
                            - NavigationTools Tools Tools Tools Tools Tools <br />
                            - LibrariesScreenTools Tools Tools Tools Tools <br />
                            - ExpoScreenTools Tools Tools Tools Tools <br />
                          </p>
                        </div>    
                          
                      </div>   
                    </div>
                    <div className="grid  w-full mb-24">

                      <div>
                        <p className='mt-10 w-full text-xl font-mono leading-8'>
                        Requirements:
                        <br></br>
                        No previous experience required. Basic knowledge of Javascript will be helpful.<br></br>
                        <br></br>
                        Description<br></br>
                        <br></br>
                        Want to launch and grow your career as a mobile app developer? Learn everything you need to know about React native? This course is for you!<br/>
                        <br></br>
                        This course covers all the topics that you need to know to build enterprise cross-platform mobile apps for Android and iOS.<br/>
                        <br></br>
                        Want to learn about Navigation? Covered. Integrate Redux and compare to React Context? Sure! Use REST APIs and even Firebase Databases? Included. Does it include User Authentication? Of course!<br/>
                        <br></br>
                        We&apos;ll start by mastering the fundamentals of React, including JSX, props, state and styles. And of course, hooks will be used for the reusable functional components. Besides that, basics of class components will be presented as that is something you may encounter in legacy code. We will also learn the basics of git and the source code will be provided in git provided for each section, so you can follow the code there as well. The course will cover creating many different reusable components which will be reused in the apps included in the course, as well as you can use them for your own personal projects later.<br/>
                        <br></br>
                        React Native is a great choice for developing cross-platform mobile apps on Android, iOS and even Web. With single source code you are able to build mobile app for multiple platforms. And the amazing part is that it feels like a native app as it&apos;s based on native modules. And on top of that, it brings more advantages to mobile app development which aren&apos;t even possible in native apps like over-the-air updates, etc. This is due to the fact that it is using Javascript, which is the most popular programming language and you can achieve a lot with that - from web development to mobile and to backend.<br></br>
                        <br></br>
                        Who this course is for:<br></br>
                        <br></br>
                        Beginner Javascript/React/React Native Developers curious about mobile app development<br/>
                        React Native Developers who want to learn some more advanced topics, such as Firebase Integration, React Native CLI vs. Expo, etc.<br/>
                          
                        </p>
                      </div>    
                    </div>

                    {/* / */}
                  </div>
                  <div>
                    <div className='w-[80%] ml-[20%] mt-10 h-[30em] rounded-3xl bg-[#2B2B2B]'>

                    </div>
                    <div className='w-[80%] ml-[20%] mt-10 h-[10em] rounded-3xl bg-[#2B2B2B]'>

                    </div>

                  </div>

                  {/*  */}
                </div>
              </div>

              
            </>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default Home;
