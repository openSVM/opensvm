'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getConnection } from '@/lib/solana-connection';
import { formatDistanceToNow } from 'date-fns';

interface SlotInfo {
  slot: number;
  timestamp: number;
  blockTime: number;
  parentSlot: number;
  blockHeight: number;
  leader?: string;
  transactions?: number;
}

export default function SlotsPage() {
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSlots() {
      try {
        const connection = await getConnection();
        const currentSlot = await connection.getSlot();
        
        // Fetch last 20 slots
        const slotPromises = Array.from({ length: 20 }, async (_, i) => {
          const slot = currentSlot - i;
          try {
            const [block, blockTime] = await Promise.all([
              connection.getBlock(slot, { maxSupportedTransactionVersion: 0 }),
              connection.getBlockTime(slot)
            ]);

            if (!block || !blockTime) return null;

            return {
              slot,
              timestamp: Date.now(),
              blockTime: blockTime,
              parentSlot: block.parentSlot,
              blockHeight: block.parentSlot + 1, // Approximate block height from parent slot
              leader: block.rewards?.[0]?.pubkey,
              transactions: block.transactions.length
            };
          } catch (err) {
            console.error(`Error fetching slot ${slot}:`, err);
            return null;
          }
        });

        const results = await Promise.all(slotPromises);
        setSlots(results.filter((slot): slot is NonNullable<typeof slot> => slot !== null));
      } catch (err) {
        console.error('Error fetching slots:', err);
        setError('Failed to load slot information');
      } finally {
        setLoading(false);
      }
    }

    fetchSlots();
    const interval = setInterval(fetchSlots, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Slots</h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Slots</h1>
        <p className="text-sm text-muted-foreground">
          Auto-refreshes every 10 seconds
        </p>
      </div>

      <div className="grid gap-6">
        {loading ? (
          // Loading state
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/4 mb-4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : slots.length > 0 ? (
          // Display slots
          slots.map((slot) => (
            <Card key={slot.slot}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Slot {slot.slot}
                    </h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Block Height: {slot.blockHeight.toLocaleString()}</p>
                      <p>Parent Slot: {slot.parentSlot}</p>
                      <p>
                        Block Time:{' '}
                        {formatDistanceToNow(slot.blockTime * 1000, {
                          addSuffix: true,
                        })}
                      </p>
                      {slot.leader && (
                        <p>
                          Leader:{' '}
                          <span className="font-mono">
                            {slot.leader.slice(0, 4)}...{slot.leader.slice(-4)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {slot.transactions} txs
                    </div>
                    <div className="text-sm text-muted-foreground">
                      transactions
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-muted-foreground">No slots found</p>
        )}
      </div>
    </div>
  );
}
