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
  "0xaA9227cb66Cdb0c1602f43E4d1bc1892f8704707";
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
                  <h1 className='text-[3vh] ml-2 font-sans font-medium'>ZkSync Score</h1>
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
              <div className={styles.infoSide}>
                <h1 className='text-[4vh] w-full'>ZkSync Score NFT</h1><br/>
                <h2 className='text-[2vh] mt-5 sm:mt-1 '>Check your activity score on ZkSync and mint NFT</h2><br/>
                <h2 className='text-[2vh] mt-5 sm:mt-1 '>Mint 1$ + gas</h2><br/>
                <div>
                  <button onClick={zksyncBridge} className="inline sm:w-8">
                    <Image src="/insta.png" alt="thirdweb Logo" width= {40} height={40} />
                  </button>
                  <button onClick={zksyncTwitter} className="inline sm:w-8">
                    <Image src="/twitter.png" alt="thirdweb Logo" width= {40} height={40} />
                  </button>
                  <button onClick={zksyncWebsite} className="ml-2 inline sm:w-8">
                    <Image src="/logo.png" alt="thirdweb Logo" width= {40} height={40}/>
                  </button>
                  </div>
              </div>
              <div className={styles.imageSide}>
                {/* Image Preview of NFTs */}
                <img
                  className={styles.image}
                  src={contractMetadata?.image}
                  alt={`${contractMetadata?.name} preview image`}
                />
                {/* Amount claimed so far */}
                <div className={styles.mintCompletionArea}>
                  <div className={styles.mintAreaLeft}>
                    <p>Total Minted</p>
                  </div>
                  <div className={styles.mintAreaRight}>
                    {claimedSupply ? (
                      <p>
                        <b>{numberClaimed}</b>
                        {" / "}
                        {numberTotal || "∞"}
                      </p>
                    ) : (
                      // Show loading state if we're still loading the supply
                      <p>Loading...</p>
                    )}
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
                    {/* <p className='flex justify-center'>Quantity</p>
                    <div className={styles.quantityContainer}>
                      <button
                        className={`${styles.quantityControlButton}`}
                        onClick={() => setQuantity(quantity - 1)}
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <h4>{quantity}</h4>
                      <button
                        className={`${styles.quantityControlButton}`}
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={quantity >= maxClaimable}
                      >
                        +
                      </button>
                    </div> */}
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
              </div>
            </>
          )}
        </div>
        {/* Powered by thirdweb */}{" "}
        {/* <img
          src="/logo.png"
          alt="thirdweb Logo"
          width={135}
          className={styles.buttonGapTop}
        /> */}
      </div>
    </div>
  );
};
export default Home;
