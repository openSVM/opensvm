import { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
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
import { getRPCLatency } from '@/lib/solana';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ResponseTime {
  timestamp: string;
  pingTime: number;
}

const TIME_RANGES = [
  { id: 'range-30m', label: '30m', value: '30m' },
  { id: 'range-2h', label: '2H', value: '2h' },
  { id: 'range-6h', label: '6H', value: '6h' }
] as const;

export default function NetworkResponseChart() {
  const [timeRange, setTimeRange] = useState<'30m' | '2h' | '6h'>('30m');
  const [responseData, setResponseData] = useState<ResponseTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number>();

  useEffect(() => {
    async function updateLatency() {
      try {
        const latency = await getRPCLatency();
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        setResponseData(prev => {
          const newData = [...prev.slice(1)];
          newData.push({ timestamp, pingTime: latency });
          return newData;
        });
        setError(null);
      } catch (err) {
        console.error('Error updating latency:', err);
        setError('Failed to measure network latency');
      }
    }

    async function initialize() {
      try {
        setIsLoading(true);
        const now = Date.now();
        const initialData: ResponseTime[] = Array.from({ length: 30 }, (_, i) => ({
          timestamp: new Date(now - (29 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pingTime: 0,
        }));
        setResponseData(initialData);
        
        // Get first real measurement
        await updateLatency();
      } catch (err) {
        console.error('Error initializing chart:', err);
        setError('Failed to initialize network monitoring');
      } finally {
        setIsLoading(false);
      }
    }

    initialize();

    // Update every 15 seconds for more frequent measurements
    intervalRef.current = window.setInterval(updateLatency, 15000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Network Response Time',
        color: '#718096',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          bottom: 24,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y.toFixed(0)}ms`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#718096',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#2D3748',
        },
        ticks: {
          color: '#718096',
          callback: (value) => `${value}ms`,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      line: {
        tension: 0.3,
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 4,
      },
    },
  };

  const chartData: ChartData<'line'> = {
    labels: responseData.map(d => d.timestamp),
    datasets: [
      {
        data: responseData.map(d => d.pingTime),
        borderColor: '#00E599',
        backgroundColor: '#00E59920',
        fill: true,
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="w-full bg-[#1A1B23] rounded-lg p-4 mb-6 h-[300px] flex items-center justify-center">
        <div className="text-gray-400">Loading network statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-[#1A1B23] rounded-lg p-4 mb-6 h-[300px] flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#1A1B23] rounded-lg p-4 mb-6">
      <div className="h-[300px]">
        <Line options={options} data={chartData} />
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-400">
          Last update: {responseData[responseData.length - 1]?.timestamp || 'N/A'}
        </div>
        <div className="flex gap-2">
          {TIME_RANGES.map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1 rounded ${
                timeRange === range.value
                  ? 'bg-[#00E599] text-black'
                  : 'bg-[#2D3748] text-gray-300'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 