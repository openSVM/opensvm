"use client";

import React, { useEffect, useRef } from 'react';

export interface TPSChartData {
  timestamp: number;
  tps: number;
  blockTime: number;
}

export interface NetworkTPSChartProps {
  data: TPSChartData[];
}

export function NetworkTPSChart({ data }: NetworkTPSChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 40;
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;

    // Calculate scales
    const timeRange = data[data.length - 1].timestamp - data[0].timestamp;
    const maxTPS = Math.max(...data.map(d => d.tps));
    const maxBlockTime = Math.max(...data.map(d => d.blockTime));

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding); // Y-axis
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding); // X-axis
    ctx.stroke();

    // Draw TPS line
    const tpsPoints = data.map((d, i) => ({
      x: padding + (i / (data.length - 1)) * width,
      y: canvas.height - padding - (d.tps / maxTPS) * height
    }));

    ctx.beginPath();
    ctx.strokeStyle = '#8884d8';
    ctx.lineWidth = 2;
    ctx.moveTo(tpsPoints[0].x, tpsPoints[0].y);
    for (let i = 1; i < tpsPoints.length; i++) {
      ctx.lineTo(tpsPoints[i].x, tpsPoints[i].y);
    }
    ctx.stroke();

    // Draw block time line
    const blockTimePoints = data.map((d, i) => ({
      x: padding + (i / (data.length - 1)) * width,
      y: canvas.height - padding - (d.blockTime / maxBlockTime) * height
    }));

    ctx.beginPath();
    ctx.strokeStyle = '#82ca9d';
    ctx.lineWidth = 2;
    ctx.moveTo(blockTimePoints[0].x, blockTimePoints[0].y);
    for (let i = 1; i < blockTimePoints.length; i++) {
      ctx.lineTo(blockTimePoints[i].x, blockTimePoints[i].y);
    }
    ctx.stroke();

    // Draw labels
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#666';

    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.fillText(`${maxTPS.toFixed(0)} TPS`, padding - 5, padding);
    ctx.fillText('0', padding - 5, canvas.height - padding + 12);

    // Block time labels (right side)
    ctx.textAlign = 'left';
    ctx.fillText(`${maxBlockTime.toFixed(1)}s`, canvas.width - padding + 5, padding);
    ctx.fillText('0s', canvas.width - padding + 5, canvas.height - padding + 12);

    // X-axis labels
    ctx.textAlign = 'center';
    const startTime = new Date(data[0].timestamp);
    const endTime = new Date(data[data.length - 1].timestamp);
    ctx.fillText(startTime.toLocaleTimeString(), padding, canvas.height - padding + 24);
    ctx.fillText(endTime.toLocaleTimeString(), canvas.width - padding, canvas.height - padding + 24);

    // Legend
    const legendY = padding - 20;
    ctx.beginPath();
    ctx.strokeStyle = '#8884d8';
    ctx.moveTo(padding + 10, legendY);
    ctx.lineTo(padding + 30, legendY);
    ctx.stroke();
    ctx.fillText('TPS', padding + 50, legendY + 4);

    ctx.beginPath();
    ctx.strokeStyle = '#82ca9d';
    ctx.moveTo(padding + 90, legendY);
    ctx.lineTo(padding + 110, legendY);
    ctx.stroke();
    ctx.fillText('Block Time', padding + 140, legendY + 4);

  }, [data]);

  return (
    <div className="h-[300px]">
      <h3 className="text-lg font-semibold mb-4">Network Performance</h3>
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        className="w-full h-full"
        style={{ maxHeight: 'calc(100% - 2rem)' }}
      />
    </div>
  );
}
