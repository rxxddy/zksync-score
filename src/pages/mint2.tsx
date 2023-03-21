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



  function handleButtonClick() {
    window.location.href = '/home';
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

  const [selected, setSelected] = useState(null);



  const images = [
    "https://image.api.playstation.com/vulcan/ap/rnd/202303/0621/d3c11818a78c6495e84a3d8e8dd6dc652721be36e0eb8c0a.png",
    "https://image.api.playstation.com/vulcan/ap/rnd/202211/1601/a8lO7A5RQI2i0tdynjT0dkFC.png",
    "https://www.serial-gamers.fr/wp-content/uploads/2021/01/unnamed-file-289.jpg",
    "https://media-assets.wired.it/photos/635fe3ebee513782eb4b651b/1:1/w_2160,h_2160,c_limit/Fortnite-Ralph%20Lauren%20x%20Fortnite-2.png",
    "https://assets2.rockpapershotgun.com/fortnite-chapter-3-season-1-the-foundation.jpg/BROK/thumbnail/1200x1200/quality/100/fortnite-chapter-3-season-1-the-foundation.jpg",
    "https://assets.reedpopcdn.com/Untitled-1_HA20Dxv.jpg/BROK/thumbnail/1200x1200/quality/100/Untitled-1_HA20Dxv.jpg"
  ];

  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  return (
    <div>

        <nav className="bg-[#000000]">
          <div className="bg-[#000000] container mx-auto flex items-center h-24 rounded-3xl">
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
              <nav className="contents font-semibold text-base lg:text-lg">
              <ul className="mx-auto flex items-center">
                  
                  <button onClick={handleButtonClick} className="p-5 xl:p-8 text-[#d9d9d9] active hover:text-[#ffffff]">
                      Home
                  </button>
                  <button className="p-5 xl:p-8 text-[#c1c1c1] active ">
                      Mint
                  </button>
              </ul>
              </nav>
              
                  <ConnectWallet 
                      accentColor="#000000"
                      colorMode="light"
                      btnTitle="Connect Wallet"
                  />
              
          </div>
      </nav>

      <div className="h-[100%]">
        
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <>

            {/* <div className="fixed bottom-[10%] w-full flex justify-center">
                  <div className="w-7.5/12 flex justify-between gap-8">
                    {images.map((imgSrc, index) => (
                      <div
                        key={index}
                        className="h-[16em] w-[12em] relative cursor-pointer"
                        onClick={() => setSelectedImage(index)}
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

<div className="fixed bottom-[10%] w-full flex justify-center px-5">
  <div className="w-7.5/12 flex justify-between gap-8 overflow-x-auto">
    {images.map((imgSrc, index) => (
      <div
        key={index}
        className="h-[16em] w-[12em] relative cursor-pointer flex-shrink-0"
        onClick={() => setSelectedImage(index)}
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
