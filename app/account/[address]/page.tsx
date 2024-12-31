'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardContent, Text, Stack, Button } from 'rinlab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getTokenAccounts, getTransactionHistory, unsubscribeFromTransactions, type TransactionInfo, type AccountData } from '@/lib/solana';
import AccountOverview from '@/components/AccountOverview';
import Link from 'next/link';
import { format } from 'date-fns';
import Image from 'next/image';
import TransactionTable from '@/components/TransactionTable';

export default function AccountPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const address = params.address as string;
  
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [transactionType, setTransactionType] = useState(searchParams.get('type') || 'all');
  const [activeTab, setActiveTab] = useState('overview');
  const itemsPerPage = 50;

  // Handle new transactions from WebSocket
  const handleNewTransaction = useCallback((newTx: TransactionInfo) => {
    setTransactions(prev => {
      const updated = [newTx, ...prev];
      return updated.slice(0, 100);
    });
  }, []);

  // Load initial data
  useEffect(() => {
    async function loadAccountData() {
      try {
        const [data, txHistory] = await Promise.all([
          getTokenAccounts(address),
          getTransactionHistory(address, {
            limit: itemsPerPage,
            type: transactionType as 'all' | 'sol' | 'token' | 'nft'
          }, handleNewTransaction)
        ]);

        setAccountData(data);
        setTransactions(txHistory);
        setHasMore(txHistory.length === itemsPerPage);
      } catch (err) {
        setError('Failed to load account details');
        console.error('Error loading account:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAccountData();

    // Cleanup subscription on unmount
    return () => {
      unsubscribeFromTransactions(address);
    };
  }, [address, transactionType, handleNewTransaction]);

  const handleTypeChange = (newType: string) => {
    setTransactionType(newType);
    router.push(`/account/${address}?type=${newType}`);
    // Reset and reload with new type
    setTransactions([]);
    setIsLoading(true);
    getTransactionHistory(address, {
      limit: itemsPerPage,
      type: newType as 'all' | 'sol' | 'token' | 'nft'
    }, handleNewTransaction)
      .then(txHistory => {
        setTransactions(txHistory);
        setHasMore(txHistory.length === itemsPerPage);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error loading transactions:', err);
        setIsLoading(false);
      });
  };

  const handleLoadMore = async () => {
    if (!hasMore || isLoading) return;

    try {
      const lastTx = transactions[transactions.length - 1];
      const moreTxs = await getTransactionHistory(address, {
        limit: itemsPerPage,
        before: lastTx.signature,
        type: transactionType as 'all' | 'sol' | 'token' | 'nft'
      });

      setTransactions(prev => [...prev, ...moreTxs]);
      setHasMore(moreTxs.length === itemsPerPage);
    } catch (err) {
      console.error('Error loading more transactions:', err);
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

  if (isLoading || !accountData) {
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <AccountOverview 
        address={address}
        solBalance={accountData.lamports / 1e9}
        tokenAccounts={accountData.tokenAccounts.slice(0, 4)}
        isSystemProgram={accountData.isSystemProgram}
        parsedOwner={
          accountData.isSystemProgram ? 'System Program' : 
          (accountData.owner === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' || 
           accountData.owner === 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb') 
            ? accountData.tokenAccounts[0]?.owner || address
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
                <div>
                  <Text variant="label">Owner</Text>
                  <Text variant="default" className="font-mono">{accountData.owner}</Text>
                </div>
                <div>
                  <Text variant="label">Executable</Text>
                  <Text variant="default">{accountData.executable ? 'Yes' : 'No'}</Text>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tokens">
              <div className="p-6">
                {accountData.tokenAccounts.length > 0 ? (
                  <div className="space-y-4">
                    {accountData.tokenAccounts.map((token, index) => (
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