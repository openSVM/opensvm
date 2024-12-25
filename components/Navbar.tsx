'use client';

import { useState } from 'react';

export default function Navbar() {
  const [solPrice] = useState('$103.45');
  const [priceChange] = useState('+2.34%');
  const [avgFee] = useState('0.000005');

  return (
    <nav className="bg-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <span className="text-[18px] font-semibold text-black">OPENSVM</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a
                href="#"
                className="inline-flex items-center border-b-2 border-blue-500 px-1 pt-1 text-[14px] font-medium text-blue-500"
              >
                Home
              </a>
              <a
                href="#"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-[14px] font-medium text-gray-700 hover:border-blue-500 hover:text-blue-500"
              >
                Tokens
              </a>
              <a
                href="#"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-[14px] font-medium text-gray-700 hover:border-blue-500 hover:text-blue-500"
              >
                NFTs
              </a>
              <a
                href="#"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-[14px] font-medium text-gray-700 hover:border-blue-500 hover:text-blue-500"
              >
                Analytics
              </a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-[13px]">
              <div className="flex items-center space-x-1">
                <img src="/images/sol-logo.svg" alt="SOL" className="h-5 w-5" />
                <span className="font-medium text-gray-900">{solPrice}</span>
                <span className="text-green-500">{priceChange}</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="text-gray-500">
                Avg Fee: <span className="text-gray-900">{avgFee} SOL</span>
              </div>
            </div>
            <button className="rounded-md bg-[#00ffbd] px-3 py-1.5 text-[13px] font-medium text-black hover:bg-[#00e6aa]">
              Connect Wallet
            </button>
            <button className="rounded-md bg-gray-100 p-2 text-gray-400 hover:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 