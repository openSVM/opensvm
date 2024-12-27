'use client';

import { useEffect, useState } from 'react';
import { getTopPrograms } from '@/lib/solana';

interface Program {
  address: string;
  txCount: number;
}

export function TopPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const fetchedPrograms = await getTopPrograms(10);
        setPrograms(fetchedPrograms);
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrograms();
    const interval = setInterval(fetchPrograms, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-black/20 backdrop-blur-sm p-6 animate-pulse">
        <h2 className="text-xl font-semibold mb-4">Top Programs</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-700/50 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-black/20 backdrop-blur-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Top Programs</h2>
      <div className="space-y-4">
        {programs.map((program) => (
          <div
            key={program.address}
            className="flex items-center justify-between p-3 rounded-lg bg-black/30"
          >
            <div className="flex items-center space-x-4">
              <div className="text-sm font-mono">
                <div className="text-gray-300 truncate w-48">
                  {program.address}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">
                {program.txCount.toLocaleString()} txs
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 