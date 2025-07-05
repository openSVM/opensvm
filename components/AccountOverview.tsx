"use client";

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { type TokenAccount } from '@/lib/solana';
import AccountExplorerLinks from './AccountExplorerLinks';
import { 
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface Props {
  address: string;
  solBalance: number;
  tokenAccounts: TokenAccount[];
  isSystemProgram?: boolean;
  parsedOwner?: string;
}

export default function AccountOverview({ 
  address, 
  solBalance, 
  tokenAccounts,
  isSystemProgram,
  parsedOwner
}: Props) {
  const [accountStats, setAccountStats] = useState<{
    totalTransactions: string | number | null;
    tokenTransfers: number | null;
  }>({ totalTransactions: null, tokenTransfers: null });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function fetchAccountStats() {
      try {
        setStatsLoading(true);
        const response = await fetch(`/api/account-stats/${address}`);
        if (!response.ok) throw new Error('Failed to fetch account stats');
        const data = await response.json();
        setAccountStats({
          totalTransactions: data.totalTransactions ?? null,
          tokenTransfers: data.tokenTransfers ?? null
        });
      } catch (error) {
        console.error('Error fetching account stats:', error);
        setAccountStats({ totalTransactions: null, tokenTransfers: null });
      } finally {
        setStatsLoading(false);
      }
    }

    fetchAccountStats();
  }, [address]);

  // Calculate portfolio breakdown for pie chart
  const portfolioData = useMemo(() => {
    // Colors for pie chart
    const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];
    
    const data = [];
    
    // Add SOL balance (assuming $235.19 per SOL for USD value calculation)
    const SOL_PRICE = 235.19;
    if (solBalance > 0) {
      data.push({
        name: 'SOL',
        value: solBalance,
        usdValue: solBalance * SOL_PRICE,
        color: '#9945FF' // Solana purple
      });
    }
    
    // Add token balances with USD values (mock prices for now)
    tokenAccounts.forEach((token) => {
      if (token.uiAmount && token.uiAmount > 0) {
        // Mock USD price calculation - in real implementation this would come from API
        const mockPrice = token.symbol === 'USDC' ? 1 : 
                         token.symbol === 'USDT' ? 1 :
                         token.symbol === 'BTC' ? 43000 :
                         token.symbol === 'ETH' ? 2500 : 
                         Math.random() * 100; // Random price for other tokens
        
        data.push({
          name: token.symbol || 'Unknown',
          value: token.uiAmount,
          usdValue: token.uiAmount * mockPrice,
          color: CHART_COLORS[data.length % CHART_COLORS.length]
        });
      }
    });
    
    // Sort by USD value descending
    data.sort((a, b) => b.usdValue - a.usdValue);
    
    // Take top 10 and group rest as "Others"
    if (data.length > 10) {
      const top10 = data.slice(0, 10);
      const others = data.slice(10);
      
      const othersTotal = others.reduce((sum, item) => sum + item.usdValue, 0);
      const othersValueTotal = others.reduce((sum, item) => sum + item.value, 0);
      
      if (othersTotal > 0) {
        top10.push({
          name: 'Others',
          value: othersValueTotal,
          usdValue: othersTotal,
          color: '#666666' // Gray color for Others
        });
      }
      
      return top10;
    }
    
    return data;
  }, [solBalance, tokenAccounts]);

  return (
    <div className="rounded-lg border bg-card text-card-foreground">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Overview</h2>
        
        <div className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">SOL Balance</div>
            <div className="flex items-center gap-2">
              <div className="text-lg">{solBalance.toFixed(4)} SOL</div>
              <div className="text-sm text-muted-foreground">(${(solBalance * 235.19).toFixed(2)})</div>
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Token Balance</div>
            <div className="flex items-center gap-2">
              <div className="text-lg">{tokenAccounts.length} Tokens</div>
              <div className="text-sm text-muted-foreground">($0.00)</div>
            </div>
            {tokenAccounts && tokenAccounts.length > 0 && (
              <div className="mt-2">
                <button className="w-full flex items-center justify-between bg-muted rounded-lg p-3 hover:bg-muted/80">
                  <div className="text-sm font-mono">
                    {tokenAccounts[0]?.mint?.slice(0, 8)}...
                  </div>
                  <div className="text-sm">
                    {tokenAccounts[0]?.uiAmount?.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tokenAccounts[0]?.symbol || 'Unknown'}
                  </div>
                </button>
                {tokenAccounts.length > 1 && (
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    + {tokenAccounts.length - 1} more tokens
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Portfolio Breakdown Pie Chart */}
          {portfolioData.length > 0 && (
            <div>
              <div className="text-sm text-muted-foreground mb-2">Portfolio Breakdown</div>
              <div className="bg-muted rounded-lg p-4">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolioData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="usdValue"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {portfolioData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          `$${value.toFixed(2)}`,
                          name
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="text-sm text-muted-foreground">Total Transactions</div>
            {statsLoading ? (
              <div className="flex items-center mt-1">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : accountStats.totalTransactions === null ? (
              <div className="text-sm text-muted-foreground">-</div>
            ) : (
              <div className="text-lg">
                {typeof accountStats.totalTransactions === 'number' 
                  ? accountStats.totalTransactions.toLocaleString()
                  : accountStats.totalTransactions}
              </div>
            )}
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Token Transfers</div>
            {statsLoading ? (
              <div className="flex items-center mt-1">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : accountStats.tokenTransfers === null ? (
              <div className="text-sm text-muted-foreground">-</div>
            ) : (
              <div className="text-lg">{accountStats.tokenTransfers.toLocaleString()}</div>
            )}
          </div>

          {parsedOwner && (
            <div>
              <div className="text-sm text-muted-foreground">Owner</div>
              <div className="text-sm font-mono break-all">{parsedOwner}</div>
            </div>
          )}

          {isSystemProgram !== undefined && (
            <div>
              <div className="text-sm text-muted-foreground">Type</div>
              <div className="text-sm">{isSystemProgram ? 'System Program' : 'User Account'}</div>
            </div>
          )}

          <AccountExplorerLinks address={address} />
        </div>
      </div>
    </div>
  );
}
