import Image from 'next/image';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TokenAccount } from '@/lib/solana';
import { useEffect, useState } from 'react';

interface AccountOverviewProps {
  address: string;
  solBalance: number;
  tokenAccounts: TokenAccount[];
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
      {/* Desktop View */}
      <div className="block">
        <div className="flex flex-row gap-2">
          <div className="flex-1">
            <Card className="bg-background border border-border">
              <CardHeader>
                <h2 className="text-lg font-semibold">Overview</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">SOL Balance</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {solBalance.toFixed(4)} SOL
                      </span>
                      <span className="text-sm text-muted-foreground">
                        (${(solBalance * 198.35).toFixed(2)})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Token Balance</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {tokenAccounts.length} Tokens
                      </span>
                      <span className="text-sm text-muted-foreground">
                        (${totalValueUsd.toFixed(2)})
                      </span>
                    </div>
                  </div>
                  {tokenAccounts.length > 0 && (
                    <div className="border border-border rounded-lg bg-background">
                      {tokenAccounts.map((token, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between px-2 py-1 hover:bg-muted cursor-pointer border-b border-border last:border-b-0 transition-colors"
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
                              <span className="text-sm">
                                {Number(token.uiAmount || 0).toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: token.decimals
                                })} {token.symbol}
                              </span>
                              {token.usdValue > 0 && (
                                <span className="text-sm text-muted-foreground">
                                  (${token.usdValue.toFixed(2)})
                                </span>
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
                <h2 className="text-lg font-semibold">More info</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-sm text-muted-foreground">Owner</span>
                    <div className="flex items-center">
                      <span className="text-sm hover:text-muted-foreground cursor-pointer transition-colors">
                        {isSystemProgram ? 'System Program' : parsedOwner}
                      </span>
                      <Button variant="ghost" className="p-1 ml-1 text-foreground hover:text-muted-foreground transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">isOnCurve</span>
                    <div className="inline-block px-2 py-0.5 bg-background border border-border text-foreground text-[13px] rounded">TRUE</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Stake</span>
                    <span className="text-sm">0 SOL</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            <Card className="bg-background border border-border">
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Announcements</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-destructive border border-border"></div>
                    <a 
                      href="https://pad404.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="ml-2 text-[13px] hover:text-muted-foreground transition-colors"
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
                      className="ml-2 text-[13px] hover:text-muted-foreground transition-colors"
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
