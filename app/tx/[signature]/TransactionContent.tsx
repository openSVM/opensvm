'use client';

import type { DetailedTransactionInfo } from '@/lib/solana';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/LoadingSpinner';
import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { formatNumber } from '@/lib/utils';

// Dynamically import components with no SSR and proper loading states
// Using a ref for the tooltip positioning and timer
const { useRef } = React;

const TransactionNodeDetails = dynamic(
  () => import('@/components/TransactionNodeDetails').catch(err => {
    console.error('Failed to load TransactionNodeDetails:', err);
    return () => <div>Error loading transaction details</div>;
  }),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

const TransactionAnalysis = dynamic(
  () => import('@/components/TransactionAnalysis').catch(err => {
    console.error('Failed to load TransactionAnalysis:', err);
    return () => <div>Error loading transaction analysis</div>;
  }),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

const TransactionGraph = dynamic(
  () => import('@/components/TransactionGraph').catch(err => {
    console.error('Failed to load TransactionGraph:', err);
    return () => <div>Error loading transaction graph</div>;
  }),
  {
    loading: () => <div className="h-[400px] flex items-center justify-center"><LoadingSpinner /></div>,
    ssr: false
  }
);

// Tooltip component for account hover
const AccountTooltip = ({ 
  account, 
  children 
}: { 
  account: string, 
  children: React.ReactNode 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  
  // Timer ref for delayed hiding
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleMouseEnter = async (e: React.MouseEvent) => {
    // Set tooltip position based on mouse event
    setTooltipPosition({
      top: e.clientY + 20,
      left: e.clientX
    });
    
    setShowTooltip(true);
    
    // Clear the existing timer if there is one
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Fetch account data if needed
    // This would be implemented to fetch account info
  };
  
  const handleMouseLeave = () => {
    // Set a timer to hide the tooltip after 5 seconds
    timerRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);
  };
  
  useEffect(() => {
    // Clean up timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  return (
    <span 
      className="relative" 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {showTooltip && (
        <div 
          className="absolute z-50 bg-background border border-border p-3 rounded-md shadow-lg text-sm min-w-[300px] transition-opacity"
          style={{ 
            top: tooltipPosition.top + 'px', 
            left: tooltipPosition.left + 'px',
            opacity: showTooltip ? 1 : 0
          }}
        >
          <h3 className="font-medium mb-2">Account Overview</h3>
          <div className="text-xs break-all">{account}</div>
        </div>
      )}
    </span>
  );
};

// Skip EnhancedTransactionVisualizer for now since it requires d3
const TransactionOverview = ({ tx, signature }: { tx: DetailedTransactionInfo; signature: string }) => (
  <div className="bg-background rounded-lg p-6 shadow-lg border border-border">
    <h2 className="text-xl font-semibold mb-4 text-foreground">Transaction Overview</h2>
    <div className="text-sm space-y-4">
      <div className="break-all">
        <span className="text-muted-foreground block mb-1">Signature</span>
        <code className="bg-muted px-2 py-1 rounded text-foreground">{signature}</code>
      </div>
      <div>
        <span className="text-muted-foreground block mb-1">Status</span>
        <span className={tx?.success ? 'text-success font-medium' : 'text-destructive font-medium'}>
          {tx?.success ? 'Success' : 'Failed'}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground block mb-1">Timestamp</span>
        <span className="text-foreground">
          {tx?.timestamp ? new Date(tx.timestamp).toLocaleString() : 'Unknown'}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground block mb-1">Type</span>
        <span className="capitalize text-foreground">{tx?.type || 'Unknown'}</span>
      </div>
      <div>
        <span className="text-muted-foreground block mb-1">Slot</span>
        <span className="text-foreground">{tx?.slot?.toLocaleString() || 'Unknown'}</span>
      </div>
      
      {tx?.details?.solChanges && tx.details.solChanges.length > 0 && (
        <div>
          <span className="text-muted-foreground block mb-1 mt-4">SOL Balance Changes</span>
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs">Account</th>
                  <th className="px-3 py-2 text-right text-xs">Change</th>
                </tr>
              </thead>
              <tbody>
                {tx.details.solChanges.map((change, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="px-3 py-2">
                      <Link 
                        href={`/account/${tx.details.accounts[change.accountIndex]?.pubkey}`}
                        className="text-primary hover:underline" 
                      >
                        <AccountTooltip account={tx.details.accounts[change.accountIndex]?.pubkey || ''}>
                          {tx.details.accounts[change.accountIndex]?.pubkey.slice(0, 4)}...{tx.details.accounts[change.accountIndex]?.pubkey.slice(-4)}
                        </AccountTooltip>
                      </Link>
                    </td>
                    <td className={`px-3 py-2 text-right ${change.change > 0 ? 'text-success' : change.change < 0 ? 'text-destructive' : ''}`}>
                      {formatNumber(change.change / 1_000_000_000, { minimumFractionDigits: 4, maximumFractionDigits: 9 })} SOL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </div>
);

async function getTransactionDetails(signature: string): Promise<DetailedTransactionInfo> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    console.log(`Fetching transaction data for signature: ${signature}`);
    const response = await fetch(`/api/transaction/${signature}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`Transaction API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to fetch transaction';
      let errorDetails = '';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
        errorDetails = errorData.details ? JSON.stringify(errorData.details, null, 2) : '';
      } catch {
        errorMessage = errorText || errorMessage;
      }

      if (response.status === 404) {
        throw new Error('Transaction not found. Please check the signature and try again.');
      }
      if (response.status === 429) {
        throw new Error('Too many requests. Please try again in a few moments.');
      }
      if (response.status === 403) {
        throw new Error('Access denied. Please check your permissions.');
      }
      if (response.status === 500) {
        throw new Error(`Server error: ${errorMessage}${errorDetails ? `\n\nDetails:\n${errorDetails}` : ''}`);
      }
      throw new Error(`${errorMessage}${errorDetails ? `\n\nDetails:\n${errorDetails}` : ''}`);
    }

    const tx = await response.json();
    if (!tx) {
      throw new Error('Transaction data is empty. Please try again.');
    }

    console.log(`Successfully fetched transaction data for ${signature}`);
    return tx;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
    throw new Error('Failed to fetch transaction details');
  }
}

function ErrorDisplay({ error, signature }: { error: Error; signature: string }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      window.location.reload();
    } catch {
      setRetrying(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-background rounded-lg p-6 shadow-lg border border-destructive/20">
        <h2 className="text-xl font-semibold text-destructive mb-4">Error Loading Transaction</h2>
        <p className="text-foreground mb-4 whitespace-pre-wrap">{error.message}</p>
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">Transaction signature:</p>
          <code className="bg-muted px-2 py-1 rounded break-all">{signature}</code>
        </div>
        <div className="mt-6 text-sm text-muted-foreground">
          <p>Possible reasons:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-foreground">
            <li>The transaction signature is invalid</li>
            <li>The transaction has been pruned from the ledger</li>
            <li>Network connectivity issues</li>
            <li>RPC node rate limits</li>
            <li>Server-side processing errors</li>
          </ul>
        </div>
        <div className="mt-6">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {retrying ? (
              <span className="flex items-center">
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Retrying...
              </span>
            ) : (
              'Try Again'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Community Notes component
function CommunityNotes({ signature }: { signature: string }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mock notes for now - would be replaced with actual backend integration
  useEffect(() => {
    setNotes([
      { id: 1, text: "This transaction appears to be a token swap operation through Jupiter Exchange.", votes: 12, author: "0x1234...5678" },
      { id: 2, text: "Executed during high network congestion period, explaining the higher than usual fees.", votes: 8, author: "0xabcd...ef01" }
    ]);
  }, [signature]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    setIsSubmitting(true);
    
    // Mock submission - would normally be a fetch call
    setTimeout(() => {
      setNotes(prev => [
        ...prev,
        { id: Date.now(), text: newNote, votes: 0, author: "You" }
      ]);
      setNewNote('');
      setIsSubmitting(false);
    }, 500);
  };
  
  return (
    <div className="bg-background rounded-lg p-6 shadow-lg border border-border">
      <h2 className="text-xl font-semibold mb-4 text-foreground">Community Notes</h2>
      
      <div className="space-y-4 mb-6">
        {notes.map(note => (
          <div key={note.id} className="bg-muted/30 p-3 rounded-md">
            <p className="text-foreground">{note.text}</p>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Posted by: {note.author}</span>
              <span>{note.votes} votes</span>
            </div>
          </div>
        ))}
        {notes.length === 0 && <p className="text-muted-foreground">No community notes yet. Be the first to add one!</p>}
      </div>
    </div>
  );
}

function LoadingState({ signature }: { signature: string }) {
  const [showSlowLoadingMessage, setShowSlowLoadingMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSlowLoadingMessage(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-background rounded-lg p-6 shadow-lg border border-border">
        <div className="flex items-center justify-center mb-4">
          <LoadingSpinner />
        </div>
        <p className="text-center text-foreground mb-4">Loading transaction details...</p>
        {showSlowLoadingMessage && (
          <p className="text-center text-muted-foreground text-sm mb-4">
            This is taking longer than usual. Please wait...
          </p>
        )}
        <div className="text-sm text-muted-foreground text-center">
          <p className="mb-2">Transaction signature:</p>
          <code className="bg-muted px-2 py-1 rounded break-all">{signature}</code>
        </div>
      </div>
    </div>
  );
}

export default function TransactionContent({ signature }: { signature: string }) {
  const [tx, setTx] = useState<DetailedTransactionInfo | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const data = await getTransactionDetails(signature);
        setTx(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [signature]);

  if (loading) {
    return <LoadingState signature={signature} />;
  }

  if (error || !tx) {
    return <ErrorDisplay error={error || new Error('Failed to load transaction')} signature={signature} />;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TransactionOverview tx={tx} signature={signature} />
          <ErrorBoundary fallback={<div>Error loading transaction details</div>}>
            <Suspense fallback={<LoadingSpinner />}>
              <div className="bg-background rounded-lg p-6 shadow-lg border border-border">
                <TransactionNodeDetails tx={tx} />
              </div>
            </Suspense>
          </ErrorBoundary>

          {/* Transaction Analysis - Now spans 2 columns and is below the overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Graph - Now with the same width as Transaction Analysis */}
            <ErrorBoundary fallback={<div>Error loading transaction graph</div>}>
              <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><LoadingSpinner /></div>}>
                <div className="bg-background rounded-lg p-6 shadow-lg border border-border">
                  <h2 className="text-xl font-semibold mb-4 text-foreground">Transaction Graph</h2>
                  <TransactionGraph 
                    initialSignature={signature} 
                    onTransactionSelect={(sig) => {if (sig !== signature) window.location.href = `/tx/${sig}`;}} 
                    height={400} />
                </div>
              </Suspense>
            </ErrorBoundary>

            {/* Transaction Analysis */}
            <ErrorBoundary fallback={<div>Error loading transaction analysis</div>}>
              <Suspense fallback={<LoadingSpinner />}>
                <div className="bg-background rounded-lg p-6 shadow-lg border border-border">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Transaction Analysis</h2>
                <TransactionAnalysis tx={tx} />
              </div>
            </Suspense>
           </ErrorBoundary>
          
            {/* Community Notes Section */}
            <div className="mt-6">
              <ErrorBoundary fallback={<div>Error loading community notes</div>}>
                <CommunityNotes signature={signature} />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}