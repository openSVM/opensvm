'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, Activity, DollarSign, Zap, AlertTriangle, InfoIcon } from 'lucide-react';

interface DEXData {
  liquidity: Array<{
    dex: string;
    poolAddress: string;
    tokenA: string;
    tokenB: string;
    liquidityUSD: number;
    volume24h: number;
    fees24h: number;
    tvl: number;
    timestamp: number;
  }>;
  volume: Array<{
    dex: string;
    volume24h: number;
    volumeChange: number;
    activeUsers: number;
    transactions: number;
    avgTransactionSize: number;
    timestamp: number;
  }>;
  arbitrage: Array<{
    tokenPair: string;
    sourceDEX: string;
    targetDEX: string;
    priceDifference: number;
    profitOpportunity: number;
    liquidityDepth: number;
    timestamp: number;
  }>;
  rankings: Array<{
    dex: string;
    totalVolume: number;
    marketShare: number;
  }>;
  health: {
    isHealthy: boolean;
    lastUpdate: number;
    connectedDEXes: number;
    dataPoints: number;
  };
}

export function SolanaDEXTab() {
  const [data, setData] = useState<DEXData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false); // New state for toggle loading

  const fetchDEXData = async () => {
    try {
      const response = await fetch('/api/analytics/dex');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch DEX data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const toggleMonitoring = async () => {
    if (toggleLoading) return; // Prevent multiple clicks
    
    setToggleLoading(true);
    try {
      const action = monitoringActive ? 'stop_monitoring' : 'start_monitoring';
      const response = await fetch('/api/analytics/dex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      
      const result = await response.json();
      if (result.success) {
        setMonitoringActive(!monitoringActive);
      } else {
        setError(result.error || 'Failed to toggle monitoring');
      }
    } catch (err) {
      console.error('Error toggling monitoring:', err);
      setError('Failed to toggle monitoring');
    } finally {
      setToggleLoading(false);
    }
  };

  useEffect(() => {
    fetchDEXData();
    const interval = setInterval(fetchDEXData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number) => {
    const formatted = (value * 100).toFixed(2);
    return value >= 0 ? `+${formatted}%` : `${formatted}%`;
  };

  const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-background border border-border rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
        {content}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading DEX analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        <AlertTriangle className="h-8 w-8 mr-2" />
        <span>Error: {error}</span>
        <button
          onClick={fetchDEXData}
          className="ml-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <span>No data available</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Solana DEX Analytics</h2>
          <p className="text-muted-foreground">Real-time DEX volume, liquidity, and arbitrage opportunities</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMonitoring}
            disabled={toggleLoading}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              monitoringActive
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:bg-destructive/50'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/50'
            } ${toggleLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {toggleLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {monitoringActive ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
          {data && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              data.health.isHealthy ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                data.health.isHealthy ? 'bg-primary' : 'bg-destructive'
              }`} />
              {data.health.isHealthy ? 'Healthy' : 'Unhealthy'}
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background border p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <Tooltip content="Number of active DEX protocols monitored via on-chain program verification">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Total DEXes <InfoIcon className="h-3 w-3" />
                </p>
              </Tooltip>
              <p className="text-2xl font-bold">{data.health.connectedDEXes}</p>
            </div>
            <Activity className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-background border p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <Tooltip content="Total number of liquidity pools and trading pairs aggregated from all DEXes">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Data Points <InfoIcon className="h-3 w-3" />
                </p>
              </Tooltip>
              <p className="text-2xl font-bold">{data.health.dataPoints.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-accent" />
          </div>
        </div>

        <div className="bg-background border p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <Tooltip content="Cross-DEX arbitrage opportunities with >0.5% price difference and sufficient liquidity">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Arbitrage Ops <InfoIcon className="h-3 w-3" />
                </p>
              </Tooltip>
              <p className="text-2xl font-bold">{data.arbitrage.length}</p>
            </div>
            <Zap className="h-8 w-8 text-secondary" />
          </div>
        </div>

        <div className="bg-background border p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <Tooltip content="Minutes since last real-time data refresh from Solana RPC and DEX APIs">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  Last Update <InfoIcon className="h-3 w-3" />
                </p>
              </Tooltip>
              <p className="text-2xl font-bold">
                {Math.floor((Date.now() - data.health.lastUpdate) / 60000)}m
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* DEX Rankings */}
      <div className="bg-background border rounded-lg shadow">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">DEX Volume Rankings</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-3 font-medium">Rank</th>
                  <th className="pb-3 font-medium">DEX</th>
                  <Tooltip content="24-hour trading volume calculated from on-chain transaction analysis">
                    <th className="pb-3 font-medium cursor-help flex items-center gap-1">
                      24h Volume <InfoIcon className="h-3 w-3" />
                    </th>
                  </Tooltip>
                  <Tooltip content="Percentage of total ecosystem trading volume captured by this DEX">
                    <th className="pb-3 font-medium cursor-help">Market Share</th>
                  </Tooltip>
                  <Tooltip content="24-hour volume change compared to previous period">
                    <th className="pb-3 font-medium cursor-help">Change</th>
                  </Tooltip>
                </tr>
              </thead>
              <tbody>
                {data.rankings.map((ranking, index) => {
                  const volumeData = data.volume.find(v => v.dex === ranking.dex);
                  return (
                    <tr key={ranking.dex} className="border-b border-border">
                      <td className="py-3 font-medium">#{index + 1}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                            {ranking.dex.charAt(0)}
                          </div>
                          {ranking.dex}
                        </div>
                      </td>
                      <td className="py-3">{formatCurrency(ranking.totalVolume)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${ranking.marketShare * 100}%` }}
                            />
                          </div>
                          {(ranking.marketShare * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="py-3">
                        {volumeData && (
                          <div className={`flex items-center gap-1 ${
                            volumeData.volumeChange >= 0 ? 'text-accent' : 'text-destructive'
                          }`}>
                            {volumeData.volumeChange >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {formatPercent(volumeData.volumeChange)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Liquidity Pools */}
      <div className="bg-background border rounded-lg shadow">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Top Liquidity Pools</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-3 font-medium">DEX</th>
                  <th className="pb-3 font-medium">Pair</th>
                  <Tooltip content="Total Value Locked - sum of all tokens deposited in the liquidity pool">
                    <th className="pb-3 font-medium cursor-help flex items-center gap-1">
                      TVL <InfoIcon className="h-3 w-3" />
                    </th>
                  </Tooltip>
                  <Tooltip content="24-hour trading volume through this specific liquidity pool">
                    <th className="pb-3 font-medium cursor-help">24h Volume</th>
                  </Tooltip>
                  <Tooltip content="Trading fees collected by liquidity providers in the last 24 hours">
                    <th className="pb-3 font-medium cursor-help">24h Fees</th>
                  </Tooltip>
                  <Tooltip content="Annualized Percentage Return - estimated yearly returns based on current fee generation">
                    <th className="pb-3 font-medium cursor-help">APR</th>
                  </Tooltip>
                </tr>
              </thead>
              <tbody>
                {data.liquidity.slice(0, 10).map((pool, index) => {
                  const apr = (pool.fees24h * 365) / pool.tvl * 100;
                  return (
                    <tr key={`${pool.dex}-${pool.poolAddress}-${index}`} className="border-b border-border">
                      <td className="py-3">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium">
                          {pool.dex}
                        </span>
                      </td>
                      <td className="py-3 font-medium">{pool.tokenA}/{pool.tokenB}</td>
                      <td className="py-3">{formatCurrency(pool.tvl)}</td>
                      <td className="py-3">{formatCurrency(pool.volume24h)}</td>
                      <td className="py-3">{formatCurrency(pool.fees24h)}</td>
                      <td className="py-3">
                        <span className={`font-medium ${
                          apr > 50 ? 'text-accent' : apr > 20 ? 'text-secondary' : 'text-muted-foreground'
                        }`}>
                          {apr.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Arbitrage Opportunities */}
      {data.arbitrage.length > 0 && (
        <div className="bg-background border rounded-lg shadow">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold">Arbitrage Opportunities</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="pb-3 font-medium">Token Pair</th>
                    <th className="pb-3 font-medium">Source DEX</th>
                    <th className="pb-3 font-medium">Target DEX</th>
                    <th className="pb-3 font-medium">Price Diff</th>
                    <th className="pb-3 font-medium">Profit Opportunity</th>
                    <th className="pb-3 font-medium">Liquidity Depth</th>
                  </tr>
                </thead>
                <tbody>
                  {data.arbitrage.slice(0, 5).map((arb, index) => (
                    <tr key={`${arb.tokenPair}-${arb.sourceDEX}-${arb.targetDEX}-${index}`} className="border-b border-border">
                      <td className="py-3 font-medium">{arb.tokenPair}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-destructive/10 text-destructive rounded text-sm">
                          {arb.sourceDEX}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-accent/10 text-accent rounded text-sm">
                          {arb.targetDEX}
                        </span>
                      </td>
                      <td className="py-3 text-secondary font-medium">
                        {formatPercent(arb.priceDifference)}
                      </td>
                      <td className="py-3 text-accent font-medium">
                        {formatCurrency(arb.profitOpportunity)}
                      </td>
                      <td className="py-3">{formatCurrency(arb.liquidityDepth)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}