'use client';

interface Block {
  slot: number;
}

interface Props {
  blocks: Block[];
  onBlockSelect?: (block: Block) => void;
  isLoading?: boolean;
}

export function RecentBlocks({ blocks, onBlockSelect, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Loading recent blocks...
      </div>
    );
  }

  const handleBlockClick = (e: React.MouseEvent, block: Block) => {
    e.preventDefault(); // Prevent navigation
    if (onBlockSelect) {
      onBlockSelect(block);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4 text-foreground">Recent Blocks</h2>
      <div className="grid gap-4">
        {blocks.map((block) => (
          <div
            key={block.slot}
            onClick={(e) => handleBlockClick(e, block)}
            className="block p-4 rounded-lg border border-border bg-background hover:bg-accent/10 transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-foreground">Block #{block.slot.toLocaleString()}</div>
              </div>
              <div className="text-muted-foreground">→</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
