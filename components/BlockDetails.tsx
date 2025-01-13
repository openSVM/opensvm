'use client';

import { useState, useEffect } from 'react';
import { getBlockDetails } from '@/lib/solana';
import { Button } from '@/components/ui/button';
import { TransactionsInBlock } from '@/components/TransactionsInBlock';
import { VersionedBlockResponse, PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import { Copy } from 'lucide-react';

// Known program names
const PROGRAM_NAMES: Record<string, string> = {
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'Token Program',
  '11111111111111111111111111111111': 'System Program',
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb': 'Token-2022',
  // Add more known programs here
};

// Helper functions
const getProgramName = (address: string) => PROGRAM_NAMES[address];
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

interface Transaction {
  signature: string;
  type: string;
  timestamp: number | null;
}

interface FormattedBlockDetails {
  slot: number;
  timestamp: number | null;
  blockhash: string;
  parentSlot: number;
  transactions: Transaction[];
  transactionCount: number;
  successCount: number;
  failureCount: number;
  previousBlockhash: string;
  totalSolVolume: number;
  totalFees: number;
  rewards?: {
    pubkey: string;
    lamports: number;
    postBalance: number;
    rewardType: string;
  }[];
  programs: {
    address: string;
    count: number;
    name?: string;
  }[];
  blockTimeDelta?: number;
  tokenTransfers: {
    mint: string;
    symbol?: string;
    amount: number;
  }[];
}

export default function BlockDetails({ slot }: { slot: string }) {
  const [block, setBlock] = useState<FormattedBlockDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [previousBlockTime, setPreviousBlockTime] = useState<number | null>(null);

  useEffect(() => {
    async function fetchBlock() {
      try {
        setTransactionsLoading(true);
        const blockDetails = await getBlockDetails(parseInt(slot));
        if (blockDetails) {
          // Transform VersionedBlockResponse into FormattedBlockDetails
          // Process transactions and count successes/failures
          let successCount = 0;
          let failureCount = 0;
          let totalSolVolume = 0;
          let totalFees = 0;
          const programCounts = new Map<string, number>();
          const tokenTransfers = new Map<string, number>();
          
          const formattedTransactions = blockDetails.transactions?.map(tx => {
            // Track program invocations from log messages
            if (tx.meta?.logMessages) {
              const programInvokes = tx.meta.logMessages
                .filter(log => log.includes('Program') && log.includes('invoke'))
                .map(log => {
                  const match = log.match(/Program (\w+) invoke/);
                  return match?.[1];
                })
                .filter((address): address is string => !!address);

              programInvokes.forEach(address => {
                const count = programCounts.get(address) ?? 0;
                programCounts.set(address, count + 1);
              });

              // Track token transfers from SPL Token program logs
              const tokenLogs = tx.meta.logMessages.filter(log => 
                log.includes('Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke'));
              
              if (tokenLogs.length > 0) {
                const transferLogs = tx.meta.logMessages.filter(log => 
                  log.includes('Transfer') && log.includes('tokens'));
                
                transferLogs.forEach(log => {
                  const match = log.match(/Transfer (\d+) tokens/);
                  if (match) {
                    const amount = parseInt(match[1]);
                    // Get mint address from the instruction
                    const accountKeys = tx.transaction.message.getAccountKeys?.() ?? [];
                    const mintAddress = accountKeys[1]?.toString();
                    if (mintAddress) {
                      const currentAmount = tokenTransfers.get(mintAddress) ?? 0;
                      tokenTransfers.set(mintAddress, currentAmount + amount);
                    }
                  }
                });
              }
            }
            // Calculate SOL volume and fees
            if (tx.meta) {
              // Calculate fees (in lamports)
              totalFees += tx.meta.fee ?? 0;
              
              // Calculate SOL transfers
              tx.meta.preBalances.forEach((pre, index) => {
                const post = tx.meta.postBalances[index];
                if (post < pre) {
                  // Only count decreases in balance as transfers
                  totalSolVolume += (pre - post);
                }
              });
            }
            // Determine transaction type based on error and status
            let type = 'Success';
            if (tx.meta?.err) {
              // Check if error is an object with toString method
              type = typeof tx.meta.err === 'object' && tx.meta.err !== null ? 
                'Failed: ' + tx.meta.err.toString() : 
                'Failed';
              failureCount++;
            } else {
              successCount++;
            }
            return {
              signature: tx.transaction.signatures[0] ?? 'Unknown',
              type,
              timestamp: blockDetails.blockTime
            };
          }) ?? [];

          // Store current block time for next block's delta calculation
          if (blockDetails.blockTime) {
            setPreviousBlockTime(blockDetails.blockTime);
          }

          setBlock({
            slot: parseInt(slot),
            timestamp: blockDetails.blockTime ?? null,
            blockhash: blockDetails.blockhash ?? 'Unknown',
            parentSlot: blockDetails.parentSlot ?? 0,
            transactionCount: blockDetails.transactions?.length ?? 0,
            transactions: formattedTransactions,
            successCount,
            failureCount,
            previousBlockhash: blockDetails.previousBlockhash ?? 'Unknown',
            totalSolVolume: totalSolVolume / 1e9, // Convert lamports to SOL
            totalFees: totalFees / 1e9, // Convert lamports to SOL
            rewards: blockDetails.rewards,
            programs: Array.from(programCounts.entries())
              .map(([address, count]) => ({ 
                address, 
                count,
                name: getProgramName(address)
              }))
              .sort((a, b) => b.count - a.count),
            blockTimeDelta: blockDetails.blockTime && previousBlockTime ? 
              blockDetails.blockTime - previousBlockTime : undefined,
            tokenTransfers: Array.from(tokenTransfers.entries())
              .map(([mint, amount]) => ({
                mint,
                amount,
                symbol: undefined // We'll implement token symbol lookup later
              }))
              .sort((a, b) => b.amount - a.amount)
          });
        } else {
          setError('Block not found');
        }
      } catch (err) {
        setError('Failed to fetch block details');
      } finally {
        setLoading(false);
        setTransactionsLoading(false);
      }
    }

    fetchBlock();
  }, [slot, previousBlockTime]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">Loading block details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12 text-red-500">{error}</div>
      </div>
    );
  }

  if (!block) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">Block not found</div>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <Link 
            href={`/block/${parseInt(slot) - 1}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Previous Block
          </Link>
          <Link 
            href={`/block/${parseInt(slot) + 1}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Next Block →
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">
            Block #{block?.slot?.toLocaleString() ?? 'Unknown'}
            {block.blockTimeDelta && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (+{block.blockTimeDelta.toFixed(2)}s)
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">
            {block?.timestamp
              ? new Date(block.timestamp * 1000).toLocaleString()
              : 'Timestamp not available'}
          </p>
        </div>

        {/* Program Invocations */}
        {block.programs.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Program Invocations</h2>
            <div className="space-y-2">
              {block.programs.slice(0, 5).map(({ address, count, name }) => (
                <div key={address} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link href={`/program/${address}`} className="font-mono text-sm hover:underline">
                      {address}
                    </Link>
                    <button 
                      onClick={() => copyToClipboard(address)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {name && (
                      <span className="text-xs text-muted-foreground">({name})</span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Block Rewards */}
        {block.rewards && block.rewards.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Block Rewards</h2>
            <div className="space-y-2">
              {block.rewards.map((reward) => (
                <div key={reward.pubkey} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link href={`/account/${reward.pubkey}`} className="font-mono text-sm hover:underline">
                      {reward.pubkey}
                    </Link>
                    <button 
                      onClick={() => copyToClipboard(reward.pubkey)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {(reward.lamports / 1e9).toFixed(4)} SOL
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Token Transfers */}
        {block.tokenTransfers.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Token Transfers</h2>
            <div className="space-y-2">
              {block.tokenTransfers.map(({ mint, symbol, amount }) => (
                <div key={mint} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link href={`/token/${mint}`} className="font-mono text-sm hover:underline">
                      {symbol ?? mint}
                    </Link>
                    <button 
                      onClick={() => copyToClipboard(mint)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {amount.toLocaleString()} tokens
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm text-muted-foreground mb-2">Blockhash</div>
            <div className="font-mono break-all">{block?.blockhash ?? 'Unknown'}</div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm text-muted-foreground mb-2">Previous Blockhash</div>
            <div className="font-mono break-all">{block?.previousBlockhash ?? 'Unknown'}</div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm text-muted-foreground mb-2">Parent Slot</div>
            <div className="font-mono">{block?.parentSlot?.toLocaleString() ?? 'Unknown'}</div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm text-muted-foreground mb-2">Transactions</div>
            <div className="font-mono space-y-2">
              <div className="flex items-center gap-2">
                <span>{block.transactionCount.toLocaleString()}</span>
                {block.transactionCount > 0 && (
                  <span className="text-sm group relative">
                    (<span className="text-green-500 hover:underline cursor-help">{((block.successCount / block.transactionCount) * 100).toFixed(1)}%</span>
                    {' / '}
                    <span className="text-red-500 hover:underline cursor-help">{((block.failureCount / block.transactionCount) * 100).toFixed(1)}%</span>)
                    <span className="invisible group-hover:visible absolute left-0 -bottom-8 w-24 bg-popover text-popover-foreground p-2 rounded-md text-xs shadow-lg text-center">
                      Success rate
                    </span>
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground flex gap-4">
                <div className="group relative cursor-help">
                  <div className="hover:underline">{block.totalSolVolume.toFixed(4)} SOL</div>
                  <span className="invisible group-hover:visible absolute left-0 -bottom-8 w-24 bg-popover text-popover-foreground p-2 rounded-md text-xs shadow-lg text-center">
                    SOL moved
                  </span>
                </div>
                <div className="group relative cursor-help">
                  <div className="hover:underline">{block.totalFees.toFixed(4)} SOL</div>
                  <span className="invisible group-hover:visible absolute left-0 -bottom-8 w-24 bg-popover text-popover-foreground p-2 rounded-md text-xs shadow-lg text-center">
                    TX fees
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <Button 
            onClick={() => setShowTransactions(!showTransactions)}
            variant="outline"
            className="w-full md:w-auto"
            disabled={transactionsLoading}
          >
            {transactionsLoading ? 'Loading Transactions...' : 
             showTransactions ? 'Hide Transactions' : 
             `Show Transactions (${block?.transactionCount ?? 0})`}
          </Button>
        </div>

        {showTransactions && (
          <div className="mt-8">
            <TransactionsInBlock block={block} />
          </div>
        )}
      </div>
    </main>
  );
}
