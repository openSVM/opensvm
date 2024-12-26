'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getInitialBlocks, subscribeToBlocks, type BlockInfo } from '@/lib/solana';

export default function RecentBlocks() {
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<BlockInfo | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      // Get initial blocks
      const initialBlocks = await getInitialBlocks(6);
      if (mounted) {
        setBlocks(initialBlocks);
      }

      // Subscribe to new blocks
      const unsubscribe = subscribeToBlocks((block) => {
        if (mounted) {
          setBlocks(prev => [block, ...prev].slice(0, 6));
        }
      });

      return () => {
        mounted = false;
        unsubscribe();
      };
    }

    init();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-mono mb-6 flex items-center gap-2">
          <span className="inline-block w-4 border-t border-[#00DC82]/40"></span>
          RECENT BLOCKS
          <span className="inline-block w-4 border-t border-[#00DC82]/40"></span>
        </h2>

        <div className="space-y-4">
          {blocks.map((block) => (
            <button
              key={block.slot}
              onClick={() => setSelectedBlock(block)}
              className="w-full text-left p-4 rounded bg-secondary/50 hover:bg-secondary/80 border transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 text-[#00DC82]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" />
                  </svg>
                </div>
                <div>
                  <div className="font-mono text-sm group-hover:text-[#00DC82] transition-colors">Block {block.slot}</div>
                  <div className="font-mono text-xs text-muted-foreground mt-1">{block.timestamp}</div>
                </div>
              </div>
              <div className="mt-2 font-mono text-xs text-muted-foreground truncate">
                {block.blockhash}
              </div>
            </button>
          ))}

          {blocks.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Loading blocks...
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-mono mb-6 flex items-center gap-2">
          <span className="inline-block w-4 border-t border-[#00DC82]/40"></span>
          BLOCK DETAILS
          <span className="inline-block w-4 border-t border-[#00DC82]/40"></span>
        </h2>

        {selectedBlock ? (
          <div className="space-y-4">
            <div className="p-4 rounded bg-secondary/50 border">
              <div className="text-sm text-muted-foreground">Slot</div>
              <div className="font-mono mt-1">{selectedBlock.slot}</div>
            </div>
            <div className="p-4 rounded bg-secondary/50 border">
              <div className="text-sm text-muted-foreground">Blockhash</div>
              <div className="font-mono mt-1 break-all">{selectedBlock.blockhash}</div>
            </div>
            <div className="p-4 rounded bg-secondary/50 border">
              <div className="text-sm text-muted-foreground">Parent Slot</div>
              <div className="font-mono mt-1">{selectedBlock.parentSlot}</div>
            </div>
            <div className="p-4 rounded bg-secondary/50 border">
              <div className="text-sm text-muted-foreground">Timestamp</div>
              <div className="font-mono mt-1">{selectedBlock.timestamp}</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            Select a block to view details
          </div>
        )}
      </div>
    </div>
  );
} 