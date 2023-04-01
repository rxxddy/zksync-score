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

  function handleButtonClick2() {
    window.location.href = '/courses';
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

  function redirectToCoursesPage(imageNumber: number) {
    if (imageNumber === 1) {
      window.location.href = '/courses';
    } else if (imageNumber === 2) {
      window.location.href = '/page2';
    } else if (imageNumber === 3) {
      window.location.href = '/page3';
    }
  }
  

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
                    <button onClick={handleButtonClick2} className="p-5 xl:p-8 text-[#c1c1c1] active ">Courses</button>
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
                        Courses
                      </button>
                    </li>
                    <li>
                      <ConnectWallet
                        accentColor="#252525"
                        colorMode="dark"
                        btnTitle="Connect Wallet"
                      />
                    </li>
                  </ul>
                )}
                <div className="hidden md:block">
                  <ConnectWallet
                    accentColor="#252525"
                    colorMode="light"
                    btnTitle="Connect Wallet"
                  />
                </div>
              </nav>
              
          </div>
      </nav>
      <div className='w-[80%] h-[60em] m-auto items-center flex'>
        <div className='w-[35em] h-60 items-center ml-20 '>
            <p className='font-mono text-xl'>First Web3 online courses platform</p><br></br>
            <br></br>
            <p className='font-mono text-[2.5em]'>Bringing Web3 To Learning</p><br></br>
            <br></br>
            <p className='font-mono text-xl'>Skills for your present (and your future). Get started with us.</p>
        </div>
      </div>
      <div className='w-full'>
        <div className='w-[65%] m-auto items-center flex '>
          <p className='font-mono text-[1.6em]'>Trending Courses:</p><br></br>
        </div>
      </div>
      <div className='w-[65%] h-[30em] m-auto items-center flex bg-[#252525] border-2 border-[grey] hover:bg-[#171717] cursor-pointer' onClick={() => redirectToCoursesPage(1)}>
        <img
          key={'https://external-preview.redd.it/1GIbkRiU0HE6PVtBxBNa7mD2EpA_7rA9ZjDAQDpPsfU.jpg?width=640&crop=smart&auto=webp&s=a49ffb84576197ab0692feaf58e84e389d140f76'}
          src={'https://external-preview.redd.it/1GIbkRiU0HE6PVtBxBNa7mD2EpA_7rA9ZjDAQDpPsfU.jpg?width=640&crop=smart&auto=webp&s=a49ffb84576197ab0692feaf58e84e389d140f76'}
          alt="placeholder"
          className='h-[20em] rounded-xl ml-20'
        />   
        <div>
          <p className='leading-10 w-full text-3xl font-mono ml-20'>
            React Native Complete Guide 2023: Zero to Mastery
          </p>
          <p className=' w-full text-base font-mono ml-20 leading-6 mt-6'>
          Everything about React Native - build cross-platform enterprise apps, incl. Hooks,<br /> Redux, Firebase, Rest API, Publishing <br />
          Tools Tools Tools Tools Tools Tools Tools Tools <br />
          </p>
          <p className='leading-10 w-full text-xs font-mono ml-20'>
          By Dave De Cooper
          </p>
          <p className='leading-10 w-full text-3xl font-mono ml-20 mt-32'>
          $16.99
          </p>
        </div>
      </div>
      <div className='w-6/12 m-auto'>
        <div className="grid grid-cols-4 gap-4">
          <div className=' h-[20em] w-56 rounded-xl mt-16 mb-8 cursor-pointer' onClick={() => redirectToCoursesPage(1)}>
            <img
              key={'https://external-preview.redd.it/1GIbkRiU0HE6PVtBxBNa7mD2EpA_7rA9ZjDAQDpPsfU.jpg?width=640&crop=smart&auto=webp&s=a49ffb84576197ab0692feaf58e84e389d140f76'}
              src={'https://external-preview.redd.it/1GIbkRiU0HE6PVtBxBNa7mD2EpA_7rA9ZjDAQDpPsfU.jpg?width=640&crop=smart&auto=webp&s=a49ffb84576197ab0692feaf58e84e389d140f76'}
              alt="placeholder"
              className='h-full rounded-3xl'
            />
            <p className='font-mono text-md '>React Native Complete Guide 2023</p>
            <p className='font-mono text-md '>$16.99</p>
          </div>
          <div className=' h-[20em] w-56 rounded-xl mt-16 mb-8 cursor-pointer' onClick={() => redirectToCoursesPage(2)}>
            <img
              key={'https://moralis.io/wp-content/uploads/2022/03/2022_02_How_to_Become_a_web3_developer_full_guide_V4.0.jpg'}
              src={'https://moralis.io/wp-content/uploads/2022/03/2022_02_How_to_Become_a_web3_developer_full_guide_V4.0.jpg'}
              alt="placeholder"
              className='h-full rounded-3xl'
            />
            <p className='font-mono text-md '>Web3 Programming With Moralis</p>
            <p className='font-mono text-md '>$6.12</p>
          </div>
          <div className=' h-[20em] w-56 rounded-xl mt-16 mb-8 cursor-pointer' onClick={() => redirectToCoursesPage(3)}>
            <img
              key={'https://miro.medium.com/v2/resize:fit:1080/1*NU0vBKtpCt9hfkVImj7keQ@2x.jpeg'}
              src={'https://miro.medium.com/v2/resize:fit:1080/1*NU0vBKtpCt9hfkVImj7keQ@2x.jpeg'}
              alt="placeholder"
              className='h-full rounded-3xl'
            />
            <p className='font-mono text-md '>Fullstack blockchain Developer</p>
            <p className='font-mono text-md '>$99.99</p>
          </div>
          <div className=' h-[20em] w-56 rounded-xl mt-16 mb-8 cursor-pointer'>
            <img
              key={'https://thumbs.dreamstime.com/b/c-programming-code-abstract-technology-background-computer-software-coding-d-c-programming-code-abstract-technology-background-219889203.jpg'}
              src={'https://thumbs.dreamstime.com/b/c-programming-code-abstract-technology-background-computer-software-coding-d-c-programming-code-abstract-technology-background-219889203.jpg'}
              alt="placeholder"
              className='h-full rounded-3xl'
            />
            <p className='font-mono text-md '>C++ Fullsatck Dev</p>
            <p className='font-mono text-md '>$47.99</p>
          </div>
          <div className=' h-[20em] w-56 rounded-xl mt-16 mb-8 cursor-pointer'>
            <img
              key={'https://moralis.io/wp-content/uploads/2022/03/2022_02_How_to_Become_a_web3_developer_full_guide_V4.0.jpg'}
              src={'https://moralis.io/wp-content/uploads/2022/03/2022_02_How_to_Become_a_web3_developer_full_guide_V4.0.jpg'}
              alt="placeholder"
              className='h-full rounded-3xl'
            />
            <p className='font-mono text-md '>Web3 Programming With Moralis</p>
            <p className='font-mono text-md '>$6.12</p>
          </div>
          <div className=' h-[20em] w-56 rounded-xl mt-16 mb-8 cursor-pointer'>
            <img
              key={'https://miro.medium.com/v2/resize:fit:1080/1*NU0vBKtpCt9hfkVImj7keQ@2x.jpeg'}
              src={'https://miro.medium.com/v2/resize:fit:1080/1*NU0vBKtpCt9hfkVImj7keQ@2x.jpeg'}
              alt="placeholder"
              className='h-full rounded-3xl'
            />
            <p className='font-mono text-md '>Fullstack blockchain Developer</p>
            <p className='font-mono text-md '>$99.99</p>
          </div>
          <div className=' h-[20em] w-56 rounded-xl mt-16 mb-8 cursor-pointer'>
            <img
              key={'https://thumbs.dreamstime.com/b/c-programming-code-abstract-technology-background-computer-software-coding-d-c-programming-code-abstract-technology-background-219889203.jpg'}
              src={'https://thumbs.dreamstime.com/b/c-programming-code-abstract-technology-background-computer-software-coding-d-c-programming-code-abstract-technology-background-219889203.jpg'}
              alt="placeholder"
              className='h-full rounded-3xl'
            />
            <p className='font-mono text-md '>C++ Fullsatck Dev</p>
            <p className='font-mono text-md '>$47.99</p>
          </div>
          <div className=' h-[20em] w-56 rounded-xl mt-16 mb-8 cursor-pointer'>
            <img
              key={'https://moralis.io/wp-content/uploads/2022/03/2022_02_How_to_Become_a_web3_developer_full_guide_V4.0.jpg'}
              src={'https://moralis.io/wp-content/uploads/2022/03/2022_02_How_to_Become_a_web3_developer_full_guide_V4.0.jpg'}
              alt="placeholder"
              className='h-full rounded-3xl'
            />
            <p className='font-mono text-md '>Web3 Programming With Moralis</p>
            <p className='font-mono text-md '>$6.12</p>
          </div>
          <div className=' h-[20em] w-56 rounded-xl mt-16 mb-8 cursor-pointer'>
            <img
              key={'https://thumbs.dreamstime.com/b/c-programming-code-abstract-technology-background-computer-software-coding-d-c-programming-code-abstract-technology-background-219889203.jpg'}
              src={'https://thumbs.dreamstime.com/b/c-programming-code-abstract-technology-background-computer-software-coding-d-c-programming-code-abstract-technology-background-219889203.jpg'}
              alt="placeholder"
              className='h-full rounded-3xl'
            />
            <p className='font-mono text-md '>C++ Fullsatck Dev</p>
            <p className='font-mono text-md '>$47.99</p>
          </div>
          <div className=' h-[20em] w-56 rounded-xl mt-16 mb-8 cursor-pointer'>
            <img
              key={'https://external-preview.redd.it/1GIbkRiU0HE6PVtBxBNa7mD2EpA_7rA9ZjDAQDpPsfU.jpg?width=640&crop=smart&auto=webp&s=a49ffb84576197ab0692feaf58e84e389d140f76'}
              src={'https://external-preview.redd.it/1GIbkRiU0HE6PVtBxBNa7mD2EpA_7rA9ZjDAQDpPsfU.jpg?width=640&crop=smart&auto=webp&s=a49ffb84576197ab0692feaf58e84e389d140f76'}
              alt="placeholder"
              className='h-full rounded-3xl'
            />
            <p className='font-mono text-md '>React Native Complete Guide 2023</p>
            <p className='font-mono text-md '>$16.99</p>
          </div>
          <div className=' h-[20em] w-56 rounded-xl mt-16 mb-8 cursor-pointer'>
            <img
              key={'https://moralis.io/wp-content/uploads/2022/03/2022_02_How_to_Become_a_web3_developer_full_guide_V4.0.jpg'}
              src={'https://moralis.io/wp-content/uploads/2022/03/2022_02_How_to_Become_a_web3_developer_full_guide_V4.0.jpg'}
              alt="placeholder"
              className='h-full rounded-3xl'
            />
            <p className='font-mono text-md '>Web3 Programming With Moralis</p>
            <p className='font-mono text-md '>$6.12</p>
          </div>
          <div className=' h-[20em] w-56 rounded-xl mt-16 mb-8 cursor-pointer'>
            <img
              key={'https://miro.medium.com/v2/resize:fit:1080/1*NU0vBKtpCt9hfkVImj7keQ@2x.jpeg'}
              src={'https://miro.medium.com/v2/resize:fit:1080/1*NU0vBKtpCt9hfkVImj7keQ@2x.jpeg'}
              alt="placeholder"
              className='h-full rounded-3xl'
            />
            <p className='font-mono text-md '>Fullstack blockchain Developer</p>
            <p className='font-mono text-md '>$99.99</p>
          </div>


        </div>
      </div>
    </div>
  );
};

export default Home;
