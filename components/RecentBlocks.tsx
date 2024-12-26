'use client';

import { useEffect, useState } from 'react';
import { connection } from '@/lib/solana';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import Link from 'next/link';

export default function RecentBlocks() {
  const [blocks, setBlocks] = useState<number[]>([]);

  useEffect(() => {
    let mounted = true;

    async function subscribeToBlocks() {
      const slot = await connection.getSlot();
      if (mounted) {
        setBlocks([slot]);
      }

      const id = connection.onSlotChange(({ slot }) => {
        if (mounted) {
          setBlocks(prev => [slot, ...prev].slice(0, 10));
        }
      });

      return () => {
        connection.removeSlotChangeListener(id);
      };
    }

    const unsubscribePromise = subscribeToBlocks();

    return () => {
      mounted = false;
      unsubscribePromise.then(unsubscribe => unsubscribe());
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Blocks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {blocks.map(slot => (
            <Link
              key={slot}
              href={`/block/${slot}`}
              className="block p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div className="font-mono">#{formatNumber(slot)}</div>
                <div className="text-sm text-muted-foreground">View Details →</div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 