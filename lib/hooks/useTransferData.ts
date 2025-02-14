import { useState, useEffect } from 'react';

interface Transfer {
  id: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  timestamp: string;
}

export function useTransferData() {
  const [data, setData] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulated data for testing
    const mockData: Transfer[] = [
      { id: 'tx1', amount: 100, status: 'success', timestamp: new Date().toISOString() },
      { id: 'tx2', amount: -50, status: 'pending', timestamp: new Date().toISOString() },
      { id: 'tx3', amount: 75, status: 'failed', timestamp: new Date().toISOString() },
      // Add more mock data as needed
    ];

    // Simulate API call
    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  return { data, loading, error };
}