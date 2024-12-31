import Image from 'next/image';
import { Card, CardHeader, CardContent, Grid, Text, Button } from 'rinlab';
import { TokenAccountInfo } from '@/lib/solana';
import { useEffect, useState } from 'react';

interface AccountOverviewProps {
  address: string;
  solBalance: number;
  tokenAccounts: TokenAccountInfo[];
  isSystemProgram?: boolean;
  parsedOwner?: string;
}

export default function AccountOverview({ 
  address, 
  solBalance, 
  tokenAccounts,
  isSystemProgram = false,
  parsedOwner
}: AccountOverviewProps) {
  const [totalValueUsd, setTotalValueUsd] = useState<number>(0);

  useEffect(() => {
    // Calculate total USD value from token accounts
    const total = tokenAccounts.reduce((acc, token) => {
      return acc + token.usdValue;
    }, 0);

    setTotalValueUsd(total);
  }, [tokenAccounts]);

  const handleTokenClick = (tokenAccount: string) => {
    window.open(`/account/${tokenAccount}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Mobile View */}
      <div className="md:hidden space-y-6">
        {/* Account Balance Section */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">SOL Balance</h3>
            <p className="text-2xl font-bold">{solBalance.toFixed(4)} SOL</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">Token Accounts</h3>
            <p className="text-2xl font-bold">{tokenAccounts.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500">NFTs</h3>
            <p className="text-2xl font-bold">{0}</p>
          </div>
        </div>

        {/* Token Accounts Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Token Accounts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tokenAccounts.map((token, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {token.icon && (
                          <img src={token.icon} alt={token.symbol} className="w-6 h-6 rounded-full" />
                        )}
                        <div className="font-medium">{token.symbol}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm">{Number(token.uiAmount || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: token.decimals
                      })} {token.symbol}</div>
                      <div className="text-xs text-gray-500">${token.usdValue.toFixed(2)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="flex flex-row gap-2">
          <div className="flex-1">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <Text variant="heading" className="text-gray-900">Overview</Text>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Text variant="label" className="text-gray-600">SOL Balance</Text>
                    <div className="flex items-center gap-2">
                      <Text variant="default" className="text-gray-900">
                        {solBalance.toFixed(4)} SOL
                      </Text>
                      <Text variant="label" className="text-gray-600">
                        (${(solBalance * 198.35).toFixed(2)})
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text variant="label" className="text-gray-600">Token Balance</Text>
                    <div className="flex items-center gap-2">
                      <Text variant="default" className="text-gray-900">
                        {tokenAccounts.length} Tokens
                      </Text>
                      <Text variant="label" className="text-gray-600">
                        (${totalValueUsd.toFixed(2)})
                      </Text>
                    </div>
                  </div>
                  {tokenAccounts.length > 0 && (
                    <div className="border rounded-lg bg-white">
                      {tokenAccounts.map((token, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between px-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => handleTokenClick(token.address)}
                        >
                          <div className="flex items-center flex-1">
                            {token.icon && (
                              <Image 
                                src={token.icon} 
                                alt={`${token.symbol} icon`} 
                                width={20} 
                                height={20} 
                                className="mr-2"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/images/token-default.png";
                                }}
                              />
                            )}
                            <div className="flex items-center space-x-2">
                              <Text variant="default" className="text-gray-900">
                                {Number(token.uiAmount || 0).toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: token.decimals
                                })} {token.symbol}
                              </Text>
                              {token.usdValue > 0 && (
                                <Text variant="label" className="text-gray-600">
                                  (${token.usdValue.toFixed(2)})
                                </Text>
                              )}
                            </div>
                          </div>
                          <div className="text-gray-400 hover:text-gray-600">
                            &gt;
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <Text variant="heading" className="text-gray-900">More info</Text>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <div>
                    <Text variant="label" className="text-gray-600">Owner</Text>
                    <div className="flex items-center">
                      <Text variant="default" className="hover:underline cursor-pointer text-gray-900">
                        {isSystemProgram ? 'System Program' : parsedOwner}
                      </Text>
                      <Button variant="ghost" className="p-1 ml-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Text variant="label" className="text-gray-600">isOnCurve</Text>
                    <div className="inline-block px-2 py-0.5 bg-[#ecfdf5] text-[#333] text-[13px] rounded">TRUE</div>
                  </div>
                  <div>
                    <Text variant="label" className="text-gray-600">Stake</Text>
                    <Text variant="default" className="text-gray-900">0 SOL</Text>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            <Card className="bg-white border border-gray-200">
              <CardHeader className="flex items-center justify-between">
                <Text variant="heading" className="text-gray-900">Announcements</Text>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-[#ff5c00]"></div>
                    <a 
                      href="https://pad404.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="ml-2 text-[13px] text-gray-900 hover:text-[#00ffbd]"
                    >
                      Insider: <span className="text-[#ff5c00]">$PIX404</span> launching pad404.com next week! MPL404-fy your favourite memecoin and revive the community!
                    </a>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-[#00ffbd]"></div>
                    <a 
                      href="https://opensvm.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="ml-2 text-[13px] text-gray-900 hover:text-[#00ffbd]"
                    >
                      New utility for <span className="text-[#00ffbd]">$SVMAI</span>: create paid announcements on opensvm.com with ease, pay with $SVMAI via UI or our on-chain program, soon avaialiable for humans, agents and fully on-chain entities!
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 