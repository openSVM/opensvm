'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getInitialBlocks } from '@/lib/solana';
import type { Block } from '@/lib/solana';

export default function RecentBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getInitialBlocks()
      .then(initialBlocks => {
        setBlocks(initialBlocks);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading blocks:', error);
        setIsLoading(false);
      });
  }, []);

  const handleBlockClick = (slot: number) => {
    router.push(`/block/${slot}`);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-medium text-gray-900">Latest Blocks</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 animate-pulse">
            Loading blocks...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-medium text-gray-900">Latest Blocks</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
          <div>Block Number</div>
          <div>Timestamp</div>
        </div>
        <div className="space-y-2">
          {blocks.map((block) => (
            <div
              key={`block-${block.slot}`}
              onClick={() => handleBlockClick(block.slot)}
              className="grid grid-cols-2 gap-4 text-sm p-3 rounded bg-white hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100"
            >
              <div className="font-medium text-gray-900">
                #{block.slot.toLocaleString()}
              </div>
              <div className="text-gray-600">
                {block.timestamp
                  ? new Date(block.timestamp * 1000).toLocaleString()
                  : 'Loading...'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 