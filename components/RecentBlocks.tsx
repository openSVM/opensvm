'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { connection } from '@/lib/solana';

interface Block {
  slot: number;
}

export function RecentBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const slot = await connection.getSlot();
        const endSlot = slot;
        const startSlot = Math.max(0, endSlot - 9); // Get 10 blocks
        
        // Single RPC call to get slots
        const slots = await connection.getBlocks(startSlot, endSlot);
        
        const blockData = slots.map(slot => ({
          slot,
        }));

        setBlocks(blockData);
      } catch (error) {
        console.error('Error fetching blocks:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBlocks();
  }, []); // Only fetch once on mount

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Blocks</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Blocks</h2>
      <div className="space-y-4">
        {blocks.map((block) => (
          <Link
            key={block.slot}
            href={`/block/${block.slot}`}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="text-sm font-mono">
                <div className="text-gray-900">Block {block.slot}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 