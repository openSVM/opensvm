'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

// Dynamically import the TransactionGraph component
const TransactionGraph = dynamic(
  () => import('@/components/TransactionGraph').catch(err => {
    console.error('Failed to load TransactionGraph:', err);
    return () => <div>Error loading transaction graph</div>;
  }),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

interface GraphContentProps {
  signature: string;
}

export default function GraphContent({ signature }: GraphContentProps) {
  const [loading, setLoading] = useState(true);
  const [initialAccount, setInitialAccount] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      try {
        // Fetch transaction details to get the main account
        const response = await fetch(`/api/transaction/${signature}`);
        if (response.ok) {
          const data = await response.json();
          if (data.details && data.details.accounts && data.details.accounts.length > 0) {
            // Use the first account as the initial account for the graph
            setInitialAccount(data.details.accounts[0].pubkey);
          }
        }
      } catch (error) {
        console.error('Error fetching transaction details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [signature]);

  // Handle transaction selection in the graph
  const handleTransactionSelect = (newSignature: string) => {
    if (newSignature !== signature) {
      router.push(`/tx/${newSignature}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transaction Graph</h1>
        <Link 
          href={`/tx/${signature}`}
          className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          View Transaction Details
        </Link>
      </div>
      
      {/* Transaction signature display */}
      <div className="bg-muted p-4 rounded-md">
        <h2 className="text-sm font-medium text-muted-foreground mb-1">Transaction signature:</h2>
        <p className="font-mono text-xs break-all">{signature}</p>
      </div>
      
      {/* Instructions */}
      <div className="p-4 bg-muted/50 border border-border rounded-md">
        <h2 className="text-sm font-medium mb-2">How to use the graph</h2>
        <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
          <li>Click on a transaction node (diamond shape) to navigate to its details</li>
          <li>Hover over nodes to see more information</li>
          <li>Use the controls in the bottom right to zoom and fit the view</li>
          <li>The graph shows 5 most recent and 5 previous transactions for each account</li>
          <li>Green lines indicate token transfers</li>
        </ul>
      </div>
      
      {/* Graph visualization */}
      <div className="bg-background rounded-lg p-6 shadow-lg border border-border">
        <div className="h-[600px]">
          {initialAccount ? (
            <TransactionGraph 
              initialSignature={signature} 
              initialAccount={initialAccount}
              onTransactionSelect={handleTransactionSelect}
              height={580}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                Unable to generate graph. No accounts found in transaction.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}