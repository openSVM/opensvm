"use client";

import { useEffect, useRef, useMemo } from 'react';
import { Transfer } from './shared/types';
import { analyzeTransfers, transfersToCSV, downloadCSV, groupTransfersByTx } from './shared/transfer-analytics';

interface TransferAnalyticsProps {
  transfers: Transfer[];
}

export function TransferAnalytics({ transfers }: TransferAnalyticsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analytics = useMemo(() => analyzeTransfers(transfers), [transfers]);
  const groupedTransfers = useMemo(() => groupTransfersByTx(transfers), [transfers]);

  const handleExportCSV = () => {
    const csv = transfersToCSV(transfers);
    downloadCSV(csv, 'transfers.csv');
  };

  useEffect(() => {
    if (!canvasRef.current || !analytics.volumeByDay.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 40;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;

    // Calculate max volume for scale
    const maxVolume = Math.max(...analytics.volumeByDay.map(d => d.volume));

    // Draw axes with rough style
    ctx.beginPath();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    // Y-axis with slight wobble
    ctx.moveTo(padding + Math.random() * 2, padding);
    ctx.lineTo(padding + Math.random() * 2, canvas.height - padding);
    // X-axis with slight wobble
    ctx.moveTo(padding, canvas.height - padding + Math.random() * 2);
    ctx.lineTo(canvas.width - padding, canvas.height - padding + Math.random() * 2);
    ctx.stroke();

    // Draw volume bars with hand-drawn style
    const barWidth = (width / analytics.volumeByDay.length) * 0.8;
    analytics.volumeByDay.forEach((day, i) => {
      const barHeight = (day.volume / maxVolume) * height;
      const x = padding + (width / analytics.volumeByDay.length) * i;
      const y = canvas.height - padding - barHeight;

      // Draw each bar with a sketchy style
      ctx.beginPath();
      ctx.fillStyle = '#22c55e44';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;

      // Main bar shape with wobble
      ctx.moveTo(x + Math.random() * 2, canvas.height - padding);
      ctx.lineTo(x + Math.random() * 2, y + Math.random() * 2);
      ctx.lineTo(x + barWidth + Math.random() * 2, y + Math.random() * 2);
      ctx.lineTo(x + barWidth + Math.random() * 2, canvas.height - padding);
      
      // Add some random short lines for texture
      for (let j = 0; j < 3; j++) {
        const randomY = y + Math.random() * barHeight;
        ctx.moveTo(x + Math.random() * barWidth, randomY);
        ctx.lineTo(x + Math.random() * barWidth + 5, randomY + Math.random() * 5);
      }

      ctx.stroke();
      ctx.fill();
    });

    // Draw labels
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'right';

    // Y-axis labels
    ctx.fillText(`$${maxVolume.toLocaleString()}`, padding - 5, padding + 10);
    ctx.fillText('$0', padding - 5, canvas.height - padding + 10);

    // X-axis labels
    ctx.textAlign = 'center';
    const firstDay = new Date(analytics.volumeByDay[analytics.volumeByDay.length - 1].date);
    const lastDay = new Date(analytics.volumeByDay[0].date);
    ctx.fillText(firstDay.toLocaleDateString(), padding, canvas.height - padding + 20);
    ctx.fillText(lastDay.toLocaleDateString(), canvas.width - padding, canvas.height - padding + 20);

  }, [analytics.volumeByDay]);

  return (
    <div className="space-y-6 mb-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
          <div className="text-sm text-neutral-400">Total Volume</div>
          <div className="text-xl font-medium">
            ${analytics.totalVolume.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
          <div className="text-sm text-neutral-400">Total Transactions</div>
          <div className="text-xl font-medium">
            {analytics.totalTransactions.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
          <div className="text-sm text-neutral-400">Unique Tokens</div>
          <div className="text-xl font-medium">
            {analytics.uniqueTokens.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
          <button
            onClick={handleExportCSV}
            className="w-full h-full flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Volume Chart */}
        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
          <h3 className="text-sm font-medium mb-4">Volume by Day</h3>
          <div className="h-64">
            <canvas
              ref={canvasRef}
              width={600}
              height={300}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Top Tokens */}
        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
          <h3 className="text-sm font-medium mb-4">Top Tokens by Volume</h3>
          <div className="space-y-4">
            {analytics.topTokens.map((token) => (
              <div key={token.symbol} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{token.symbol}</div>
                  <div className="text-sm text-neutral-400">
                    {token.count} transfers
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ${token.volume.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grouped Transfers */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h3 className="text-sm font-medium mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {groupedTransfers.slice(0, 5).map((tx) => (
            <div key={tx.signature} className="border-b border-neutral-800 last:border-0 pb-4 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <a
                  href={`/tx/${tx.signature}`}
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                </a>
                <div className="text-sm text-neutral-500">
                  {new Date(tx.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="space-y-2">
                {tx.transfers.map((transfer, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400">
                        {transfer.tokenSymbol || transfer.token}
                      </span>
                      <span className="text-neutral-500">
                        {transfer.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-neutral-400">
                      ${transfer.usdValue?.toLocaleString() || '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unusual Activity */}
      {analytics.unusualActivity.length > 0 && (
        <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
          <h3 className="text-sm font-medium mb-4">Unusual Activity</h3>
          <div className="space-y-4">
            {analytics.unusualActivity.map((activity, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-yellow-500">{activity.type}</div>
                  <div className="text-sm text-neutral-400">{activity.details}</div>
                  <div className="text-xs text-neutral-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
                <a
                  href={`/tx/${activity.signature}`}
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  View Transaction →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
