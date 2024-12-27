'use client';

import { useEffect, useState } from 'react';
import { getRecentBlocks } from '@/lib/solana';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Block {
  blockhash: string;
  blockTime: number | null;
  parentSlot: number;
  slot: number;
}

export function RecentBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const fetchedBlocks = await getRecentBlocks(10);
        setBlocks(fetchedBlocks.map(block => ({
          blockhash: block.blockhash,
          blockTime: block.blockTime,
          parentSlot: block.parentSlot,
          slot: block.parentSlot + 1,
        })));
      } catch (error) {
        console.error('Error fetching blocks:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBlocks();
    const interval = setInterval(fetchBlocks, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-black/20 backdrop-blur-sm p-6 animate-pulse">
        <h2 className="text-xl font-semibold mb-4">Recent Blocks</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-700/50 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-black/20 backdrop-blur-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Blocks</h2>
      <div className="space-y-4">
        {blocks.map((block) => (
          <Link
            key={block.slot}
            href={`/block/${block.slot}`}
            className="flex items-center justify-between p-3 rounded-lg bg-black/30 hover:bg-black/40 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="text-sm font-mono">
                <div className="text-gray-300">Slot {block.slot}</div>
                <div className="text-gray-500 text-xs truncate w-32">
                  {block.blockhash.slice(0, 16)}...
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">
                {block.blockTime
                  ? formatDistanceToNow(block.blockTime * 1000, { addSuffix: true })
                  : 'Processing...'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 