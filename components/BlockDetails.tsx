'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

interface BlockData {
  block: any;
  blockTime: number | null;
}

interface Props {
  slot: string;
}

export default function BlockDetails({ slot }: Props) {
  const [data, setData] = useState<BlockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/blocks/${slot}`);
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || 'Failed to fetch block data');
        }

        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch block data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slot]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !data) {
    return <div>Error: {error || 'Failed to load block data'}</div>;
  }

  const { block, blockTime } = data;

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Block Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Block #{formatNumber(parseInt(slot))}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground">Block Time</div>
              <div className="text-xl font-semibold">
                {blockTime ? new Date(blockTime * 1000).toLocaleString() : 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Block Height</div>
              <div className="text-xl font-semibold">
                {block.blockHeight ? formatNumber(block.blockHeight) : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Parent Slot</div>
              <div className="text-xl font-semibold">
                {formatNumber(block.parentSlot)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Transactions</div>
              <div className="text-xl font-semibold">
                {formatNumber(block.transactions.length)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Rewards</div>
              <div className="text-xl font-semibold">
                {formatNumber(block.rewards.reduce((acc, r) => acc + r.lamports, 0) / 1e9)} SOL
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Previous Blockhash</div>
              <div className="text-xl font-mono break-all">
                {block.previousBlockhash}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>Block Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {block.rewards.map((reward: any, index: number) => (
              <div
                key={index}
                className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-secondary rounded-lg"
              >
                <div className="flex flex-col gap-1">
                  <div className="font-mono text-sm">
                    {reward.pubkey}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {reward.rewardType}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 mt-2 md:mt-0">
                  <div className="flex flex-col">
                    <div className="text-sm text-muted-foreground">Reward</div>
                    <div className="font-semibold">
                      {formatNumber(reward.lamports / 1e9)} SOL
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-sm text-muted-foreground">Post Balance</div>
                    <div className="font-semibold">
                      {formatNumber(reward.postBalance / 1e9)} SOL
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Block Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {block.transactions.map((tx: any, index: number) => (
              <div
                key={tx.transaction.signatures[0]}
                className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-secondary rounded-lg"
              >
                <div className="flex flex-col gap-1">
                  <div className="font-mono text-sm break-all">
                    {tx.transaction.signatures[0]}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Status: {tx.meta?.err ? 'Failed' : 'Success'}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 mt-2 md:mt-0">
                  <div className="flex flex-col">
                    <div className="text-sm text-muted-foreground">Fee</div>
                    <div className="font-semibold">
                      {formatNumber((tx.meta?.fee || 0) / 1e9)} SOL
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-sm text-muted-foreground">Instructions</div>
                    <div className="font-semibold">
                      {tx.transaction.message.instructions.length}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 