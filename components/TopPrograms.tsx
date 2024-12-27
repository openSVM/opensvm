'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Program {
  address: string;
  name: string;
  transactions: number;
  volume: number;
}

const EXAMPLE_PROGRAMS: Program[] = [
  { 
    address: 'ComputeBudget111111111111111111111111111111',
    name: 'Compute Budget',
    transactions: 1245,
    volume: 0
  },
  {
    address: '11111111111111111111111111111111',
    name: 'System Program',
    transactions: 982,
    volume: 1523.45
  },
  {
    address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    name: 'Token Program',
    transactions: 756,
    volume: 892.12
  },
  {
    address: 'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K',
    name: 'Magic Eden v2',
    transactions: 543,
    volume: 2341.89
  },
  {
    address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
    name: 'Token Metadata',
    transactions: 421,
    volume: 0
  }
];

export default function TopPrograms() {
  const [programs, setPrograms] = useState<Program[]>(EXAMPLE_PROGRAMS);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleProgramClick = (address: string) => {
    router.push(`/program/${address}`);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-medium text-gray-900">Top Active Programs</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 animate-pulse">
            Loading programs...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-medium text-gray-900">Top Active Programs</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-4 gap-4 text-sm text-gray-500 mb-4">
          <div>Program Name</div>
          <div>Address</div>
          <div className="text-right">Txns</div>
          <div className="text-right">Volume</div>
        </div>
        <div className="space-y-2">
          {programs.map((program) => (
            <div
              key={`program-${program.address}`}
              onClick={() => handleProgramClick(program.address)}
              className="grid grid-cols-4 gap-4 text-sm p-3 rounded bg-white hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100"
            >
              <div className="font-medium text-gray-900">{program.name}</div>
              <div className="text-gray-500 text-xs">
                {program.address.slice(0, 4)}...{program.address.slice(-4)}
              </div>
              <div className="text-right text-gray-700">
                {program.transactions.toLocaleString()}
              </div>
              <div className="text-right text-gray-700">
                {program.volume > 0 ? `◎${program.volume.toLocaleString()}` : '-'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 