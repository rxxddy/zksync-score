import Head from 'next/head'
import Image from 'next/image'
// import { Inter } from 'next/font/google'
import styles from '@/styles/Theme.module.css'

import { ConnectWallet } from "@thirdweb-dev/react";
import { Link } from "react-router-dom";

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


// Put Your Edition Drop Contract address from the dashboard here
const myEditionDropContractAddress =
  "0x9502DbD5264D26dF4A75B68E98026219e107143b";

// Put your token ID here
const tokenId = 0;

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
        return "Mint (1$ + gas)";
      }
      return `Mint (${priceToMint})`;
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
  function zksyncTwitter() {
    window.location.href = 'https://twitter.com/zksync';
  }
  function zksyncWebsite() {
    window.location.href = 'https://zksync.io/';
  }
  function zksyncBridge() {
    window.location.href = 'https://portal.zksync.io/bridge';
  }

  const [selected, setSelected] = useState(null);



  const images = [
    "https://image.binance.vision/editor-uploads-original/9c15d9647b9643dfbc5e522299d13593.png",
    "https://static.cryptobriefing.com/wp-content/uploads/2022/01/31074857/bored-ape-unnamed-1-440x440.png",
    "https://wwwcoleccionnftes434d3.zapwp.com/q:i/r:0/wp:1/w:1/u:https://www.coleccionnft.es/wp-content/uploads/2021/12/bored-ape3749.png",
    "https://news.artnet.com/app/news-upload/2021/09/Yuga-Labs-Bored-Ape-Yacht-Club-4466.jpg",
    "https://www.thestreet.com/.image/t_share/MTgyMDU5NDcwMTc4NzU1NzE1/boredape1.jpg",
    "https://img.seadn.io/files/38e44ccc1aab2a9fb328e451c3892d9c.png?auto=format&w=600"
  ];

  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuClick = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  function handleButtonClick() {
    setIsMobileMenuOpen(false);
    window.location.href = '/home';
  }


  return (
    <div>

        <nav className="bg-[#000000]">
          <div className="bg-[#000000] container mx-auto flex items-center h-24 rounded-3xl justify-between">
              <button onClick={handleButtonClick} className="flex items-center justify-center">

                  <Image
                    src="/logo.png"
                    alt="thirdweb Logo"
                    width={60}
                    height={60}
                    className={styles.buttonGapTop}
                  />
                  <h1 className='text-2xl ml-2 font-sans font-medium'>ZkSync Score</h1>
              </button>

              {/* <nav className="contents font-semibold text-base lg:text-lg">
                <ul className="mx-auto flex items-center">
                  
                  <button onClick={handleButtonClick} className="p-5 xl:p-8 text-[#d9d9d9] active hover:text-[#ffffff]">
                      Home
                  </button>
                  <button className="p-5 xl:p-8 text-[#c1c1c1] active ">
                      Mint
                  </button>
                </ul>
                <ConnectWallet 
                    accentColor="#000000"
                    colorMode="light"
                    btnTitle="Connect Wallet"
                />
              </nav> */}
              
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
                    <button className="p-5 xl:p-8 text-[#c1c1c1] active ">Mint</button>
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
                      <button className="block w-full py-3 text-center text-[#000000]">
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
                    accentColor="#000000"
                    colorMode="light"
                    btnTitle="Connect Wallet"
                  />
                </div>
              </nav>
              
          </div>
      </nav>

      <div className="h-[50vh] items-center m-auto flex justify-center">
        
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>

{/* <div className="fixed bottom-[10%] w-full flex justify-center ">
  <div className="w-7.5/12 flex justify-between gap-8">
    {images.map((imgSrc, index) => (
      <div
        key={index}
        className="h-[16em] w-[12em] relative cursor-pointer"
        onClick={() => setSelectedImage(index)}
        style={{ boxShadow: "none" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0px 0px 10px 1px #ffffff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <img
          src={imgSrc}
          alt=""
          className="absolute inset-0 w-full object-cover"
        />
        <div
          className={`absolute bottom-0 w-full h-[30%] ${
            selectedImage === index ? "bg-white" : "bg-gray-500"
          }`}
        ></div>
        {selectedImage === index && (
          <div
            className="absolute inset-0 border-2 border-white"
            style={{ pointerEvents: "none" }}
          ></div>
        )}
      </div>
    ))}
  </div>
</div> */}
<div className="fixed bottom-[4%] w-full flex justify-center px-5">
  <div className="w-7.5/12 flex justify-between gap-8 overflow-x-auto pb-8">
    {images.map((imgSrc, index) => (
      <div
        key={index}
        className="h-[16em] w-[12em] relative cursor-pointer flex-shrink-0"
        onClick={() => setSelectedImage(index)}
        style={{ boxShadow: "none" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0px 0px 10px 1px #ffffff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <img
          src={imgSrc}
          alt=""
          className="absolute inset-0 w-full object-cover"
        />
        <div
          className={`absolute bottom-0 w-full h-[30%] ${
            selectedImage === index ? "bg-white" : "bg-gray-500"
          }`}
        ></div>
        {selectedImage === index && (
          <div
            className="absolute inset-0 border-2 border-white"
            style={{ pointerEvents: "none" }}
          ></div>
        )}
      </div>
    ))}
  </div>
</div>

                {claimConditions.data?.length === 0 ||
                claimConditions.data?.every(
                  (cc) => cc.maxClaimableSupply === "0"
                ) ? (
                  <div>
                    <h2>
                      This drop is not ready to be minted yet. (No claim condition
                      set)
                    </h2>
                  </div>
                ) : (
                  <>

                    <div className={styles.mintContainer}>
                      {isSoldOut ? (
                        <div>
                          <h2>Sold Out</h2>
                        </div>
                      ) : (
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
                        >
                          {buttonLoading ? "Loading..." : buttonText}
                        </Web3Button>
                      )}
                    </div>
                  </>
                )}
              
            </>
          )}
        
      </div>
    </div>
  );
};

export default Home;
