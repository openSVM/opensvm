'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getTokenAccounts, getConnection, type TransactionInfo, type AccountData, type DetailedTransactionInfo } from '@/lib/solana';
import { PublicKey } from '@solana/web3.js';
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
  const handleNewTransaction = useCallback((newTx: DetailedTransactionInfo) => {
    setTransactions(prev => {
      const updated = [newTx, ...prev];
      return updated.slice(0, 100);
    });
  }, []);

  // Load initial data
  useEffect(() => {
    async function loadAccountData() {
      try {
        setIsLoading(true);
        const connection = await getConnection();
        
        // Get account data and signatures in parallel
        const [data, signatures] = await Promise.all([
          getTokenAccounts(address),
          connection.getSignaturesForAddress(new PublicKey(address), { limit: 100 })
        ]);

        // Fetch all transactions in one call
        const txs = await connection.getParsedTransactions(
          signatures.map(sig => sig.signature),
          {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed'
          }
        );

        // Process transactions
        const processedTxs = txs
          .map((tx, i): TransactionInfo | null => {
            if (!tx) return null;
            const sig = signatures[i];
            
            // Extract token transfer info
            const tokenBalance = tx.meta?.preTokenBalances?.[0] || tx.meta?.postTokenBalances?.[0];
            if (tokenBalance?.mint) {
              return {
                signature: sig.signature,
                timestamp: sig.blockTime || 0,
                slot: sig.slot || 0,
                success: tx.meta?.err === null,
                type: 'token',
                amount: tokenBalance.uiTokenAmount?.uiAmount,
                symbol: undefined,
                mint: tokenBalance.mint
              };
            }
            
            // Check for SOL transfers
            if (tx.meta?.preBalances?.length && tx.meta?.postBalances?.length) {
              const balanceChange = Math.abs(tx.meta.postBalances[0] - tx.meta.preBalances[0]);
              if (balanceChange > 0) {
                return {
                  signature: sig.signature,
                  timestamp: sig.blockTime || 0,
                  slot: sig.slot || 0,
                  success: tx.meta?.err === null,
                  type: 'sol',
                  amount: balanceChange / 1e9,
                  symbol: undefined,
                  mint: undefined
                };
              }
            }

            // Default unknown transaction
            return {
              signature: sig.signature,
              timestamp: sig.blockTime || 0,
              slot: sig.slot || 0,
              success: tx.meta?.err === null,
              type: 'unknown',
              amount: undefined,
              symbol: undefined,
              mint: undefined
            };
          })
          .filter((tx): tx is TransactionInfo => tx !== null);

        setAccountData(data);
        setTransactions(processedTxs);
        setHasMore(false);
      } catch (err) {
        setError('Failed to load account details');
        console.error('Error loading account:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAccountData();
  }, [address]);

  const handleTypeChange = (newType: string) => {
    setTransactionType(newType);
    router.push(`/account/${address}?type=${newType}`);
  };

  const handleLoadMore = () => {
    // All transactions are loaded at once
    setHasMore(false);
  };

  if (error) {
    return (
      <Card className="bg-background border border-border">
        <CardHeader>
          <h2 className="text-lg font-semibold">Account Details</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !accountData) {
    return (
      <Card className="bg-background border border-border">
        <CardHeader>
          <h2 className="text-lg font-semibold">Account Details</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center">Loading account details...</p>
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

      <Card className="bg-background border border-border">
        <CardContent className="p-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex border-b border-border">
              <TabsTrigger value="overview" className="flex-1 px-4 py-2 text-sm font-medium text-foreground hover:text-foreground/80 border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground">Overview</TabsTrigger>
              <TabsTrigger value="tokens" className="flex-1 px-4 py-2 text-sm font-medium text-foreground hover:text-foreground/80 border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground">Tokens</TabsTrigger>
              <TabsTrigger value="nfts" className="flex-1 px-4 py-2 text-sm font-medium text-foreground hover:text-foreground/80 border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground">NFTs</TabsTrigger>
              <TabsTrigger value="transactions" className="flex-1 px-4 py-2 text-sm font-medium text-foreground hover:text-foreground/80 border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground">Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Address</span>
                  <span className="text-sm font-mono">{address}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Owner</span>
                  <span className="text-sm font-mono">{accountData.owner}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Executable</span>
                  <span className="text-sm">{accountData.executable ? 'Yes' : 'No'}</span>
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
                            <span className="text-sm font-medium">{token.symbol || 'Unknown Token'}</span>
                            <span className="text-sm text-muted-foreground">{token.mint}</span>
                          </div>
                        </div>
                        <span className="text-sm">
                          {Number(token.uiAmount).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: token.decimals
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center py-8">No tokens found</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="nfts">
              <div className="p-6">
                <p className="text-sm text-center py-8">No NFTs found</p>
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
