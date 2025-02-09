import { DetailedTransactionInfo } from '@/lib/solana';
import TransactionNodeDetails from '@/components/TransactionNodeDetails';
import TransactionAnalysis from '@/components/TransactionAnalysis';
import EnhancedTransactionVisualizer from '@/components/EnhancedTransactionVisualizer';
import React from 'react';

interface Props {
  params: {
    signature: string;
  };
}

async function getTransactionDetails(signature: string): Promise<DetailedTransactionInfo> {
  const res = await fetch(`/api/solana-proxy?transaction=${encodeURIComponent(signature)}`, {
    cache: 'no-store',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch transaction details');
  }

  return res.json();
}

export default async function TransactionPage({ params }: Props) {
  const { signature } = await Promise.resolve(params);
  const tx = await getTransactionDetails(signature);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel: Transaction Details */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-neutral-900 rounded-lg p-4">
          <h2 className="text-lg font-semibold">Transaction Overview</h2>
          <div className="text-sm text-gray-400">
            Signature: {signature}
            <br />
            Status: {tx?.success ? 'Success' : 'Failed'}
          </div>
        </div>

        <TransactionNodeDetails tx={tx} />
      </div>

      {/* Middle Panel: Visualizations */}
      <div className="lg:col-span-2 space-y-6">
        <EnhancedTransactionVisualizer tx={tx} />
        <TransactionAnalysis tx={tx} />
      </div>
    </div>
  );
}
