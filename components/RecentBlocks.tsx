'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { connection } from '@/lib/solana';

interface Block {
  slot: number;
  transactions?: {
    signature: string;
    type: string;
    timestamp: number | null;
  }[];
}

interface Props {
  onBlockSelect?: (block: Block) => void;
}

export function RecentBlocks({ onBlockSelect }: Props) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);

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

  const handleBlockClick = async (block: Block, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    setSelectedBlock(block.slot);
    
    if (!block.transactions) {
      try {
        const blockInfo = await connection.getBlock(block.slot, {
          maxSupportedTransactionVersion: 0
        });
        
        if (blockInfo) {
          const transactions = blockInfo.transactions.map(tx => ({
            signature: tx.transaction.signatures[0],
            type: tx.meta?.logMessages?.[0]?.includes('Program log:') 
              ? 'Program Interaction'
              : 'Transfer',
            timestamp: blockInfo.blockTime
          }));
          
          const updatedBlock = { ...block, transactions };
          setBlocks(blocks.map(b => 
            b.slot === block.slot ? updatedBlock : b
          ));
          
          if (onBlockSelect) {
            onBlockSelect(updatedBlock);
          }
        }
      } catch (error) {
        console.error('Error fetching block transactions:', error);
      }
    } else if (onBlockSelect) {
      onBlockSelect(block);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
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
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Blocks</h2>
      <div className="space-y-4">
        {blocks.map((block) => (
          <div
            key={block.slot}
            onClick={(e) => handleBlockClick(block, e)}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              selectedBlock === block.slot 
                ? 'border-gray-400 bg-gray-50' 
                : 'border-gray-200 hover:bg-gray-50'
            } transition-colors cursor-pointer`}
          >
            <div className="flex items-center space-x-4">
              <div className="text-sm font-mono">
                <div className="text-gray-900">Block {block.slot}</div>
              </div>
            </div>
            <Link
              href={`/block/${block.slot}`}
              className="text-gray-500 hover:text-gray-700 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              View Details →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
} 