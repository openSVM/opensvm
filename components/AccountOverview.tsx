import Image from 'next/image';
import { Card, CardHeader, CardContent, Grid, Text, Button } from 'rinlab';

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
    <div className="flex flex-row gap-2">
      <div className="flex-1">
        <Card>
          <CardHeader>
            <Text variant="heading">Overview</Text>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <Text variant="label">SOL Balance</Text>
                <div className="text-[15px] font-medium">
                  {solBalance.toFixed(4)} SOL
                  <Text variant="label" className="ml-2">
                    (${(solBalance * 198.35).toFixed(2)})
                  </Text>
                </div>
              </div>
              <div>
                <Text variant="label">Token Balance</Text>
                <div className="text-[15px] font-medium">
                  {tokenAccounts.length} Tokens
                  <Text variant="label" className="ml-2">
                    (${tokenAccounts.reduce((acc, token) => acc + (token.amount * 1.2), 0).toFixed(2)})
                  </Text>
                </div>
              </div>
              {tokenAccounts.length > 0 && (
                <div className="border rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Image src="/images/token-default.png" alt="Token icon" width={20} height={20} className="mr-2" />
                      <Text variant="default">
                        {tokenAccounts[0].amount.toLocaleString()} {tokenAccounts[0].symbol}
                      </Text>
                    </div>
                    <Button variant="ghost" className="p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1">
        <Card>
          <CardHeader>
            <Text variant="heading">More info</Text>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <div>
                <Text variant="label">Owner</Text>
                <div className="flex items-center">
                  <Text variant="default" className="hover:underline cursor-pointer">
                    System Program
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
                <Text variant="label">isOnCurve</Text>
                <div className="inline-block px-2 py-0.5 bg-[#ecfdf5] text-[#333] text-[13px] rounded">TRUE</div>
              </div>
              <div>
                <Text variant="label">Stake</Text>
                <Text variant="default">0 SOL</Text>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <Text variant="heading">Misc</Text>
            <Button variant="ghost" className="p-1 text-[#00ffbd]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </Button>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 