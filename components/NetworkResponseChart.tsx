'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { getRPCLatency } from '@/lib/solana';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MAX_DATA_POINTS = 30;

export function NetworkResponseChart() {
  const [latencyData, setLatencyData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    async function measureLatency() {
      const latency = await getRPCLatency();
      const now = new Date();
      const timeStr = now.toLocaleTimeString();

      setLatencyData(prev => {
        const newData = [...prev, latency];
        if (newData.length > MAX_DATA_POINTS) {
          newData.shift();
        }
        return newData;
      });

      setLabels(prev => {
        const newLabels = [...prev, timeStr];
        if (newLabels.length > MAX_DATA_POINTS) {
          newLabels.shift();
        }
        return newLabels;
      });
    }

    measureLatency();
    const interval = setInterval(measureLatency, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-lg bg-black/20 backdrop-blur-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Network Response Time</h2>
      <div className="h-64">
        <Line
          data={{
            labels,
            datasets: [
              {
                data: latencyData,
                borderColor: '#44ccff',
                backgroundColor: 'rgba(68, 204, 255, 0.1)',
                fill: true,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              x: {
                display: false,
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                  color: '#888',
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
} 