'use client';

import { Line } from 'react-chartjs-2';
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

interface NetworkResponseData {
  timestamp: number;
  successRate: number;
  latency: number;
}

interface NetworkResponseChartProps {
  data: NetworkResponseData[];
}

export function NetworkResponseChart({ data }: NetworkResponseChartProps) {
  const labels = data.map(d => new Date(d.timestamp).toLocaleTimeString());
  const latencyData = data.map(d => d.latency);

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