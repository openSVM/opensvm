'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Text, Stack, Button } from 'rinlab';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { getTransactionDetails } from '@/lib/solana';
import { ParsedTransactionWithMeta } from '@solana/web3.js';

interface TransactionDetails {
  signature: string;
  slot: number;
  blockTime: number;
  status: 'success' | 'error';
  computeUnits: number;
  fee: number;
  from: string;
  to: string;
  value: number;
  type: string;
  logs: string[];
  instructions: Array<{
    programId: string;
    data?: string;
  }>;
}

export default function TransactionPage() {
  const params = useParams();
  const router = useRouter();
  const signature = params.signature as string;
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');

  useEffect(() => {
    getTransactionDetails(signature)
      .then((tx: ParsedTransactionWithMeta | null) => {
        if (!tx || !tx.meta) {
          throw new Error('Transaction not found or invalid');
        }

        // Transform the transaction data into our expected format
        const details: TransactionDetails = {
          signature,
          slot: tx.slot || 0,
          blockTime: tx.blockTime || 0,
          status: tx.meta.err ? 'error' : 'success',
          computeUnits: tx.meta.computeUnitsConsumed || 0,
          fee: tx.meta.fee / 1e9, // Convert lamports to SOL
          from: tx.transaction.message.accountKeys[0]?.pubkey.toString() || '',
          to: tx.transaction.message.accountKeys[1]?.pubkey.toString() || '',
          value: (tx.meta.postBalances[1] - tx.meta.preBalances[1]) / 1e9, // Convert lamports to SOL
          type: 'unknown', // You can add logic to determine transaction type
          logs: tx.meta.logMessages || [],
          instructions: tx.transaction.message.instructions.map(ix => ({
            programId: ix.programId.toString(),
            data: 'data' in ix ? ix.data : undefined
          }))
        };
        
        setTransaction(details);
        setIsLoading(false);
      })
      .catch(err => {
        setError('Failed to load transaction details');
        console.error('Error loading transaction:', err);
        setIsLoading(false);
      });
  }, [signature]);

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
          amount: transaction.value,
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
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
              className="flex items-center gap-2"
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
              <div className="bg-muted p-4 rounded-lg">
                <Text variant="label" className="text-sm text-muted-foreground mb-2">GPT Analysis</Text>
                <Text variant="default">{analysis}</Text>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Text variant="label" className="text-sm text-muted-foreground">Signature</Text>
                <Text variant="default" className="font-mono break-all">{transaction.signature}</Text>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text variant="label" className="text-sm text-muted-foreground">Status</Text>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${transaction.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <Text variant="default">{transaction.status}</Text>
                  </div>
                </div>
                
                <div>
                  <Text variant="label" className="text-sm text-muted-foreground">Block Time</Text>
                  <Text variant="default">
                    {transaction.blockTime ? format(new Date(transaction.blockTime * 1000), 'MMM dd, yyyy HH:mm:ss') : 'Pending'}
                  </Text>
                </div>

                <div>
                  <Text variant="label" className="text-sm text-muted-foreground">Slot</Text>
                  <Text variant="default">{transaction.slot ? transaction.slot.toLocaleString() : 'N/A'}</Text>
                </div>

                <div>
                  <Text variant="label" className="text-sm text-muted-foreground">Compute Units</Text>
                  <Text variant="default">{transaction.computeUnits ? transaction.computeUnits.toLocaleString() : 'N/A'}</Text>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Text variant="label" className="text-sm text-muted-foreground">Transaction</Text>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <Text variant="label" className="text-xs text-muted-foreground">From</Text>
                    <Text variant="default" className="font-mono">{transaction.from}</Text>
                  </div>
                  <div className="text-right">
                    <Text variant="label" className="text-xs text-muted-foreground">To</Text>
                    <Text variant="default" className="font-mono">{transaction.to}</Text>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <Text variant="label" className="text-xs text-muted-foreground">Amount</Text>
                    <Text variant="default">{transaction.value ? transaction.value.toFixed(9) : '0.000000000'} SOL</Text>
                  </div>
                  <div className="text-right">
                    <Text variant="label" className="text-xs text-muted-foreground">Fee</Text>
                    <Text variant="default">{transaction.fee ? transaction.fee.toFixed(6) : '0.000000'} SOL</Text>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Text variant="label" className="text-sm text-muted-foreground">Instructions</Text>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                {transaction.instructions
                  .filter((ix, index, self) => 
                    index === self.findIndex(t => t.programId === ix.programId && t.data === ix.data)
                  )
                  .map((ix, index) => (
                    <div key={index} className="space-y-1">
                      <Text variant="label" className="text-xs text-muted-foreground">Program {index + 1}</Text>
                      <Text variant="default" className="font-mono break-all">{ix.programId}</Text>
                      {ix.data && (
                        <>
                          <Text variant="label" className="text-xs text-muted-foreground mt-2">Data</Text>
                          <Text variant="default" className="font-mono break-all text-xs">{ix.data}</Text>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <Text variant="label" className="text-sm text-muted-foreground">Logs</Text>
              <div className="bg-muted p-4 rounded-lg">
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
