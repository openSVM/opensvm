interface TokenAccount {
  mint: string;
  amount: number;
  symbol: string;
  decimals: number;
}

interface AccountOverviewProps {
  address: string;
  solBalance: number;
  tokenAccounts: TokenAccount[];
  isSystemProgram?: boolean;
}

export default function AccountOverview({ 
  address, 
  solBalance, 
  tokenAccounts,
  isSystemProgram = false 
}: AccountOverviewProps) {
  return (
    <div className="grid grid-cols-12 gap-2">
      <div className="col-span-4">
        <div className="bg-white rounded p-3 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#333] mb-2">Overview</h2>
          <div className="space-y-2">
            <div>
              <div className="text-[13px] text-[#666] mb-1">SOL Balance</div>
              <div className="text-[15px] font-medium text-[#333]">
                {solBalance.toFixed(4)} SOL
                <span className="text-[13px] text-[#666] ml-2">
                  (${(solBalance * 198.35).toFixed(2)})
                </span>
              </div>
            </div>
            <div>
              <div className="text-[13px] text-[#666] mb-1">Token Balance</div>
              <div className="text-[15px] font-medium text-[#333]">
                {tokenAccounts.length} Tokens
                <span className="text-[13px] text-[#666] ml-2">
                  (${tokenAccounts.reduce((acc, token) => acc + (token.amount * 1.2), 0).toFixed(2)})
                </span>
              </div>
            </div>
            {tokenAccounts.length > 0 && (
              <div className="border rounded p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img src="/images/token-default.png" alt="" className="w-5 h-5 mr-2" />
                    <span className="text-[13px] text-[#333]">
                      {tokenAccounts[0].amount.toLocaleString()} {tokenAccounts[0].symbol}
                    </span>
                  </div>
                  <button className="text-[#666]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-span-4">
        <div className="bg-white rounded p-3 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#333] mb-2">More info</h2>
          <div className="space-y-1.5">
            <div>
              <div className="text-[13px] text-[#666] mb-0.5">Owner</div>
              <div className="flex items-center">
                <span className="text-[13px] text-blue-500 hover:underline cursor-pointer">System Program</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-[#666]" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </div>
            </div>
            <div>
              <div className="text-[13px] text-[#666] mb-0.5">isOnCurve</div>
              <div className="inline-block px-2 py-0.5 bg-[#ecfdf5] text-[#333] text-[13px] rounded">TRUE</div>
            </div>
            <div>
              <div className="text-[13px] text-[#666] mb-0.5">Stake</div>
              <div className="text-[13px] text-[#333]">0 SOL</div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-4">
        <div className="bg-white rounded p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[15px] font-semibold text-[#333]">Misc</h2>
            <button className="text-[#00ffbd]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
          <div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-[#ff5c00]"></div>
              <a 
                href="https://pilot.buzz" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ml-2 text-[13px] text-[#333] hover:text-[#00ffbd]"
              >
                Trade on Pilot.buzz
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 