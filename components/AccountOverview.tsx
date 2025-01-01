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
          <div className="bg-background border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground">SOL Balance</h3>
            <p className="text-2xl font-bold text-foreground">{solBalance.toFixed(4)} SOL</p>
          </div>
          <div className="bg-background border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground">Token Accounts</h3>
            <p className="text-2xl font-bold text-foreground">{tokenAccounts.length}</p>
          </div>
          <div className="bg-background border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground">NFTs</h3>
            <p className="text-2xl font-bold text-foreground">{0}</p>
          </div>
        </div>

        {/* Token Accounts Section */}
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Token Accounts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">Token</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tokenAccounts.map((token, index) => (
                  <tr key={index} className="hover:bg-muted transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {token.icon && (
                          <img src={token.icon} alt={token.symbol} className="w-6 h-6 rounded-full border border-border" />
                        )}
                        <div className="font-medium text-foreground">{token.symbol}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-foreground">{Number(token.uiAmount || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: token.decimals
                      })} {token.symbol}</div>
                      <div className="text-xs text-muted-foreground">${token.usdValue.toFixed(2)}</div>
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
            <Card className="bg-background border border-border">
              <CardHeader>
                <Text variant="heading" className="text-foreground">Overview</Text>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Text variant="label" className="text-foreground">SOL Balance</Text>
                    <div className="flex items-center gap-2">
                      <Text variant="default" className="text-foreground">
                        {solBalance.toFixed(4)} SOL
                      </Text>
                      <Text variant="label" className="text-muted-foreground">
                        (${(solBalance * 198.35).toFixed(2)})
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text variant="label" className="text-foreground">Token Balance</Text>
                    <div className="flex items-center gap-2">
                      <Text variant="default" className="text-foreground">
                        {tokenAccounts.length} Tokens
                      </Text>
                      <Text variant="label" className="text-muted-foreground">
                        (${totalValueUsd.toFixed(2)})
                      </Text>
                    </div>
                  </div>
                  {tokenAccounts.length > 0 && (
                    <div className="border border-border rounded-lg bg-background">
                      {tokenAccounts.map((token, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between px-2 hover:bg-muted cursor-pointer border-b border-border last:border-b-0 transition-colors"
                          onClick={() => handleTokenClick(token.address)}
                        >
                          <div className="flex items-center flex-1">
                            {token.icon && (
                              <Image 
                                src={token.icon} 
                                alt={`${token.symbol} icon`} 
                                width={20} 
                                height={20} 
                                className="mr-2 border border-border rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/images/token-default.png";
                                }}
                              />
                            )}
                            <div className="flex items-center space-x-2">
                              <Text variant="default" className="text-foreground">
                                {Number(token.uiAmount || 0).toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: token.decimals
                                })} {token.symbol}
                              </Text>
                              {token.usdValue > 0 && (
                                <Text variant="label" className="text-muted-foreground">
                                  (${token.usdValue.toFixed(2)})
                                </Text>
                              )}
                            </div>
                          </div>
                          <div className="text-foreground hover:text-muted-foreground transition-colors">
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
            <Card className="bg-background border border-border">
              <CardHeader>
                <Text variant="heading" className="text-foreground">More info</Text>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <div>
                    <Text variant="label" className="text-foreground">Owner</Text>
                    <div className="flex items-center">
                      <Text variant="default" className="hover:text-muted-foreground cursor-pointer text-foreground transition-colors">
                        {isSystemProgram ? 'System Program' : parsedOwner}
                      </Text>
                      <Button variant="ghost" className="p-1 ml-1 text-foreground hover:text-muted-foreground transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Text variant="label" className="text-foreground">isOnCurve</Text>
                    <div className="inline-block px-2 py-0.5 bg-background border border-border text-foreground text-[13px] rounded">TRUE</div>
                  </div>
                  <div>
                    <Text variant="label" className="text-foreground">Stake</Text>
                    <Text variant="default" className="text-foreground">0 SOL</Text>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            <Card className="bg-background border border-border">
              <CardHeader className="flex items-center justify-between">
                <Text variant="heading" className="text-foreground">Announcements</Text>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-destructive border border-border"></div>
                    <a 
                      href="https://pad404.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="ml-2 text-[13px] text-foreground hover:text-muted-foreground transition-colors"
                    >
                      Insider: <span className="text-destructive">$PIX404</span> launching pad404.com next week! MPL404-fy your favourite memecoin and revive the community!
                    </a>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-foreground border border-border"></div>
                    <a 
                      href="https://opensvm.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="ml-2 text-[13px] text-foreground hover:text-muted-foreground transition-colors"
                    >
                      New utility for <span className="text-foreground">$SVMAI</span>: create paid announcements on opensvm.com with ease, pay with $SVMAI via UI or our on-chain program, soon avaialiable for humans, agents and fully on-chain entities!
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