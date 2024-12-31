'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardContent, Text, Stack, Button } from 'rinlab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getAccountInfo, getTransactionHistory, getTokenAccounts, type TransactionInfo, type TokenAccountInfo } from '@/lib/solana';
import AccountOverview from '@/components/AccountOverview';
import Link from 'next/link';
import { format } from 'date-fns';
import Image from 'next/image';
import TransactionTable from '@/components/TransactionTable';

interface AccountInfo {
  address: string;
  lamports: number;
  owner: string;
  executable: boolean;
  rentEpoch: number;
  data: {
    parsed?: {
      info?: {
        owner: string;
      };
    };
    program?: string;
    space?: number;
  } | Buffer;
}

export default function AccountPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const address = params.address as string;
  
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccountInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [transactionType, setTransactionType] = useState(searchParams.get('type') || 'all');
  const [activeTab, setActiveTab] = useState('overview');
  const itemsPerPage = 25;

  const loadTransactions = useCallback(async (page = 1, type = transactionType) => {
    try {
      const before = page > 1 ? transactions[transactions.length - 1]?.signature : undefined;
      const txHistory = await getTransactionHistory(address, {
        limit: itemsPerPage,
        before,
        type: type as 'all' | 'sol' | 'token' | 'nft'
      });

      if (page === 1) {
        setTransactions(txHistory);
      } else {
        setTransactions(prev => [...prev, ...txHistory]);
      }

      setHasMore(txHistory.length === itemsPerPage);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transactions');
    }
  }, [address, transactions, transactionType]);

  useEffect(() => {
    async function loadAccountData() {
      try {
        const [info, tokens] = await Promise.all([
          getAccountInfo(address),
          getTokenAccounts(address)
        ]);

        if (!info) {
          throw new Error('Account not found');
        }

        setAccountInfo(info);
        setTokenAccounts(tokens);
        await loadTransactions();
      } catch (err) {
        setError('Failed to load account details');
        console.error('Error loading account:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAccountData();
  }, [address, loadTransactions]);

  const handleTypeChange = (newType: string) => {
    setTransactionType(newType);
    router.push(`/account/${address}?type=${newType}`);
    loadTransactions(1, newType);
  };

  const handleLoadMore = () => {
    if (hasMore) {
      loadTransactions(currentPage + 1);
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <Text variant="heading">Account Details</Text>
        </CardHeader>
        <CardContent>
          <Text variant="error" className="text-center">{error}</Text>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !accountInfo) {
    return (
      <Card>
        <CardHeader>
          <Text variant="heading">Account Details</Text>
        </CardHeader>
        <CardContent>
          <Text variant="default" className="text-center">Loading account details...</Text>
        </CardContent>
      </Card>
    );
  }

  const fungibleTokens = tokenAccounts;
  const nftTokens = [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <AccountOverview 
        address={address}
        solBalance={accountInfo ? accountInfo.lamports / 1e9 : 0}
        tokenAccounts={tokenAccounts.slice(0, 4)}
        isSystemProgram={accountInfo?.owner === '11111111111111111111111111111111'}
        parsedOwner={
          accountInfo?.owner === '11111111111111111111111111111111' ? 'System Program' : 
          (accountInfo?.owner === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' || 
           accountInfo?.owner === 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb') 
            ? (!Buffer.isBuffer(accountInfo.data) 
                ? accountInfo.data.parsed?.info?.owner 
                : address)
            : address
        }
      />

      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
              <TabsTrigger value="nfts">NFTs</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="p-6 space-y-4">
                <div>
                  <Text variant="label">Address</Text>
                  <Text variant="default" className="font-mono">{address}</Text>
                </div>
                {accountInfo && (
                  <>
                    <div>
                      <Text variant="label">Owner</Text>
                      <Text variant="default" className="font-mono">{accountInfo.owner}</Text>
                    </div>
                    <div>
                      <Text variant="label">Executable</Text>
                      <Text variant="default">{accountInfo.executable ? 'Yes' : 'No'}</Text>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tokens">
              <div className="p-6">
                {tokenAccounts.length > 0 ? (
                  <div className="space-y-4">
                    {tokenAccounts.map((token, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          {token.icon ? (
                            <Image 
                              src={token.icon} 
                              alt={`${token.symbol} icon`} 
                              width={32} 
                              height={32}
                              className="rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/images/token-default.png";
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                              <span className="text-lg">*</span>
                            </div>
                          )}
                          <div>
                            <Text variant="default" className="font-medium">{token.symbol || 'Unknown Token'}</Text>
                            <Text variant="label">{token.mint}</Text>
                          </div>
                        </div>
                        <Text variant="default">
                          {Number(token.uiAmount).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: token.decimals
                          })}
                        </Text>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text variant="default" className="text-center py-8">No tokens found</Text>
                )}
              </div>
            </TabsContent>

            <TabsContent value="nfts">
              <div className="p-6">
                <Text variant="default" className="text-center py-8">No NFTs found</Text>
              </div>
            </TabsContent>

            <TabsContent value="transactions">
              <div className="p-6">
                <TransactionTable 
                  transactions={transactions}
                  isLoading={isLoading}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMore}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 