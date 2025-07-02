'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, Activity, DollarSign, Zap, AlertTriangle } from 'lucide-react';

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
      }
    } catch (err) {
      console.error('Error toggling monitoring:', err);
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
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertTriangle className="h-8 w-8 mr-2" />
        <span>Error: {error}</span>
        <button
          onClick={fetchDEXData}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
          <p className="text-gray-600">Real-time DEX volume, liquidity, and arbitrage opportunities</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMonitoring}
            className={`px-4 py-2 rounded-lg font-medium ${
              monitoringActive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {monitoringActive ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            data.health.isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              data.health.isHealthy ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {data.health.isHealthy ? 'Healthy' : 'Unhealthy'}
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total DEXes</p>
              <p className="text-2xl font-bold">{data.health.connectedDEXes}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Points</p>
              <p className="text-2xl font-bold">{data.health.dataPoints.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Arbitrage Ops</p>
              <p className="text-2xl font-bold">{data.arbitrage.length}</p>
            </div>
            <Zap className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Update</p>
              <p className="text-2xl font-bold">
                {Math.floor((Date.now() - data.health.lastUpdate) / 60000)}m
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* DEX Rankings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">DEX Volume Rankings</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium">Rank</th>
                  <th className="pb-3 font-medium">DEX</th>
                  <th className="pb-3 font-medium">24h Volume</th>
                  <th className="pb-3 font-medium">Market Share</th>
                  <th className="pb-3 font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {data.rankings.map((ranking, index) => {
                  const volumeData = data.volume.find(v => v.dex === ranking.dex);
                  return (
                    <tr key={ranking.dex} className="border-b">
                      <td className="py-3 font-medium">#{index + 1}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {ranking.dex.charAt(0)}
                          </div>
                          {ranking.dex}
                        </div>
                      </td>
                      <td className="py-3">{formatCurrency(ranking.totalVolume)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${ranking.marketShare * 100}%` }}
                            />
                          </div>
                          {(ranking.marketShare * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="py-3">
                        {volumeData && (
                          <div className={`flex items-center gap-1 ${
                            volumeData.volumeChange >= 0 ? 'text-green-600' : 'text-red-600'
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
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Top Liquidity Pools</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium">DEX</th>
                  <th className="pb-3 font-medium">Pair</th>
                  <th className="pb-3 font-medium">TVL</th>
                  <th className="pb-3 font-medium">24h Volume</th>
                  <th className="pb-3 font-medium">24h Fees</th>
                  <th className="pb-3 font-medium">APR</th>
                </tr>
              </thead>
              <tbody>
                {data.liquidity.slice(0, 10).map((pool, index) => {
                  const apr = (pool.fees24h * 365) / pool.tvl * 100;
                  return (
                    <tr key={`${pool.dex}-${pool.poolAddress}-${index}`} className="border-b">
                      <td className="py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                          {pool.dex}
                        </span>
                      </td>
                      <td className="py-3 font-medium">{pool.tokenA}/{pool.tokenB}</td>
                      <td className="py-3">{formatCurrency(pool.tvl)}</td>
                      <td className="py-3">{formatCurrency(pool.volume24h)}</td>
                      <td className="py-3">{formatCurrency(pool.fees24h)}</td>
                      <td className="py-3">
                        <span className={`font-medium ${
                          apr > 50 ? 'text-green-600' : apr > 20 ? 'text-yellow-600' : 'text-gray-600'
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
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Arbitrage Opportunities</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b">
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
                    <tr key={`${arb.tokenPair}-${arb.sourceDEX}-${arb.targetDEX}-${index}`} className="border-b">
                      <td className="py-3 font-medium">{arb.tokenPair}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                          {arb.sourceDEX}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          {arb.targetDEX}
                        </span>
                      </td>
                      <td className="py-3 text-yellow-600 font-medium">
                        {formatPercent(arb.priceDifference)}
                      </td>
                      <td className="py-3 text-green-600 font-medium">
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