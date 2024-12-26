'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Text, Stack, Button } from 'rinlab';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { getTransactionDetails, type DetailedTransactionInfo } from '@/lib/solana';

export default function TransactionPage() {
  const params = useParams();
  const router = useRouter();
  const signature = params.signature as string;
  const [transaction, setTransaction] = useState<DetailedTransactionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');

  useEffect(() => {
    getTransactionDetails(signature)
      .then(tx => {
        setTransaction(tx);
        setIsLoading(false);
      })
      .catch(err => {
        setError('Failed to load transaction details');
        console.error('Error loading transaction:', err);
        setIsLoading(false);
      });
  }, [signature]);

  const handleSearch = () => {
    if (searchQuery) {
      router.push(`/tx/${searchQuery}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const analyzeTransaction = async () => {
    if (!transaction) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: transaction.logs,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          from: transaction.from,
          to: transaction.to,
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');
      
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      console.error('Error analyzing transaction:', err);
      setAnalysis('Failed to analyze transaction');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#f8f9fa]">
      <header className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-[18px] font-semibold text-black hover:text-[#00ffbd]">
                OPENSVM
              </Link>
              <div className="w-96">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search by transaction signature"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00ffbd] focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );

  if (error) {
    return (
      <PageWrapper>
        <Card>
          <CardHeader>
            <Text variant="heading">Transaction Details</Text>
          </CardHeader>
          <CardContent>
            <Text variant="error" className="text-center">{error}</Text>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  if (isLoading || !transaction) {
    return (
      <PageWrapper>
        <Card>
          <CardHeader>
            <Text variant="heading">Transaction Details</Text>
          </CardHeader>
          <CardContent>
            <Text variant="default" className="text-center">Loading transaction details...</Text>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Text variant="heading">Transaction Details</Text>
            <Button
              variant="default"
              className="bg-[#00ffbd] hover:bg-[#00e6aa] text-black flex items-center gap-2"
              onClick={analyzeTransaction}
              disabled={isAnalyzing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
              {isAnalyzing ? 'Analyzing...' : 'Analyze with GPT'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Stack gap={6}>
            {analysis && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <Text variant="label" className="text-sm text-gray-500 mb-2">GPT Analysis</Text>
                <Text variant="default">{analysis}</Text>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Text variant="label" className="text-sm text-gray-500">Signature</Text>
                <Text variant="default" className="font-mono break-all">{transaction.signature}</Text>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text variant="label" className="text-sm text-gray-500">Status</Text>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${transaction.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <Text variant="default">{transaction.status}</Text>
                  </div>
                </div>
                
                <div>
                  <Text variant="label" className="text-sm text-gray-500">Block Time</Text>
                  <Text variant="default">
                    {transaction.blockTime ? format(transaction.blockTime, 'PPpp') : 'Pending'}
                  </Text>
                </div>

                <div>
                  <Text variant="label" className="text-sm text-gray-500">Slot</Text>
                  <Text variant="default">{transaction.slot.toLocaleString()}</Text>
                </div>

                <div>
                  <Text variant="label" className="text-sm text-gray-500">Compute Units</Text>
                  <Text variant="default">{transaction.computeUnits.toLocaleString()}</Text>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Text variant="label" className="text-sm text-gray-500">Transaction</Text>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <Text variant="label" className="text-xs text-gray-500">From</Text>
                    <Text variant="default" className="font-mono">{transaction.from}</Text>
                  </div>
                  <div className="text-right">
                    <Text variant="label" className="text-xs text-gray-500">To</Text>
                    <Text variant="default" className="font-mono">{transaction.to}</Text>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <Text variant="label" className="text-xs text-gray-500">Amount</Text>
                    <Text variant="default">{transaction.amount.toFixed(9)} SOL</Text>
                  </div>
                  <div className="text-right">
                    <Text variant="label" className="text-xs text-gray-500">Fee</Text>
                    <Text variant="default">{transaction.fee.toFixed(6)} SOL</Text>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Text variant="label" className="text-sm text-gray-500">Instructions</Text>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {transaction.instructions
                  .filter((ix, index, self) => 
                    index === self.findIndex(t => t.programId === ix.programId && t.data === ix.data)
                  )
                  .map((ix, index) => (
                    <div key={index} className="space-y-1">
                      <Text variant="label" className="text-xs text-gray-500">Program {index + 1}</Text>
                      <Text variant="default" className="font-mono break-all">{ix.programId}</Text>
                      {ix.data && (
                        <>
                          <Text variant="label" className="text-xs text-gray-500 mt-2">Data</Text>
                          <Text variant="default" className="font-mono break-all text-xs">{ix.data}</Text>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <Text variant="label" className="text-sm text-gray-500">Logs</Text>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {transaction.logs.join('\n')}
                </pre>
              </div>
            </div>
          </Stack>
        </CardContent>
      </Card>
    </PageWrapper>
  );
} 