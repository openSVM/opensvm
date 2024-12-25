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
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h3 className="text-[15px] font-medium text-gray-900">Overview</h3>
        <div className="mt-4 space-y-4">
          <div>
            <div className="text-[13px] text-gray-500">SOL Balance</div>
            <div className="mt-1">
              <div className="flex items-baseline">
                <span className="text-[15px] font-medium text-gray-900">
                  {solBalance.toLocaleString()} SOL
                </span>
                <span className="ml-2 text-[13px] text-gray-500">
                  (${(solBalance * 103.45).toLocaleString()})
                </span>
              </div>
            </div>
          </div>
          {tokenAccounts.length > 0 && (
            <div>
              <div className="text-[13px] text-gray-500">Token Balance</div>
              <div className="mt-1">
                <div className="flex items-baseline">
                  <span className="text-[15px] font-medium text-gray-900">
                    {tokenAccounts.length} Token{tokenAccounts.length !== 1 ? 's' : ''}
                  </span>
                  <span className="ml-2 text-[13px] text-gray-500">
                    (${tokenAccounts.reduce((acc, token) => acc + (token.amount * (token.symbol === 'USDC' ? 1 : 0)), 0).toLocaleString()})
                  </span>
                </div>
                <div className="mt-2 flex items-center text-[13px]">
                  <div className="flex items-center space-x-2">
                    <img src="/images/usdc-logo.svg" alt="USDC" className="h-5 w-5" />
                    <span>{(tokenAccounts[0]?.amount || 0).toLocaleString()} {tokenAccounts[0]?.symbol}</span>
                    <span className="text-gray-500">
                      (~${(tokenAccounts[0]?.amount || 0).toLocaleString()})
                    </span>
                  </div>
                  {tokenAccounts.length > 1 && (
                    <button className="ml-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h3 className="text-[15px] font-medium text-gray-900">More info</h3>
        <div className="mt-4 space-y-4">
          <div>
            <div className="text-[13px] text-gray-500">Owner</div>
            <div className="mt-1 flex items-center">
              <span className="text-[13px] text-blue-500 hover:underline cursor-pointer">
                {isSystemProgram ? 'System Program' : address}
              </span>
              <button className="ml-2 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <div className="text-[13px] text-gray-500">isOnCurve</div>
            <div className="mt-1">
              <span className="rounded bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-800">
                TRUE
              </span>
            </div>
          </div>
          <div>
            <div className="text-[13px] text-gray-500">Stake</div>
            <div className="mt-1">
              <span className="text-[13px] text-gray-900">0 SOL</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-medium text-gray-900">Misc</h3>
          <button className="text-blue-500 hover:text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>
        <div className="mt-4">
          <div className="rounded-lg bg-purple-100 p-4">
            <div className="flex items-center">
              <span className="text-[13px] font-medium text-purple-800">
                Buy SOL on MoonPay
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 