'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, Activity, ArrowUpDown, Zap, AlertTriangle, Globe } from 'lucide-react';

interface CrossChainData {
  flows: Array<{
    bridgeProtocol: string;
    sourceChain: string;
    targetChain: string;
    asset: string;
    volume24h: number;
    volumeChange: number;
    avgTransactionSize: number;
    transactionCount: number;
    bridgeFees: number;
    timestamp: number;
  }>;
  rankings: Array<{
    bridge: string;
    totalVolume: number;
    marketShare: number;
  }>;
  assets: Array<{
    asset: string;
    totalVolume: number;
    bridgeCount: number;
  }>;
  health: {
    isHealthy: boolean;
    lastUpdate: number;
    connectedBridges: number;
    dataPoints: number;
  };
}

export function CrossChainTab() {
  const [data, setData] = useState<CrossChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false); // New state for toggle loading

  const fetchCrossChainData = async () => {
    try {
      const response = await fetch('/api/analytics/cross-chain');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch cross-chain data');
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
      const response = await fetch('/api/analytics/cross-chain', {
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
      console.error('Error toggling cross-chain monitoring:', err);
      setError('Failed to toggle monitoring');
    } finally {
      setToggleLoading(false);
    }
  };

  useEffect(() => {
    fetchCrossChainData();
    const interval = setInterval(fetchCrossChainData, 60000); // Refresh every 60 seconds
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

  const getChainIcon = (chain: string) => {
    // Simple chain icon mapping
    const icons: Record<string, string> = {
      'Solana': '◎',
      'Ethereum': 'Ξ',
      'Polygon': '⬟',
      'Avalanche': '🔺',
      'BSC': '●',
      'Arbitrum': '🔷',
      'Optimism': '🔴'
    };
    return icons[chain] || '⚪';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading cross-chain analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertTriangle className="h-8 w-8 mr-2" />
        <span>Error: {error}</span>
        <button
          onClick={fetchCrossChainData}
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
          <h2 className="text-2xl font-bold">Cross-Chain Flow Analytics</h2>
          <p className="text-gray-600">Bridge flows, asset migrations, and cross-chain arbitrage opportunities</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMonitoring}
            disabled={toggleLoading}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              monitoringActive
                ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400'
                : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400'
            } ${toggleLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {toggleLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {monitoringActive ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
          {data && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              data.health.isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                data.health.isHealthy ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {data.health.isHealthy ? 'Healthy' : 'Unhealthy'}
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Bridges</p>
              <p className="text-2xl font-bold">{data.health.connectedBridges}</p>
            </div>
            <Globe className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold">
                {formatCurrency(data.flows.reduce((sum, flow) => sum + flow.volume24h, 0))}
              </p>
            </div>
            <ArrowUpDown className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Assets</p>
              <p className="text-2xl font-bold">{data.assets.length}</p>
            </div>
            <Zap className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Points</p>
              <p className="text-2xl font-bold">{data.health.dataPoints}</p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Bridge Rankings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Bridge Protocol Rankings</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium">Rank</th>
                  <th className="pb-3 font-medium">Bridge</th>
                  <th className="pb-3 font-medium">24h Volume</th>
                  <th className="pb-3 font-medium">Market Share</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.rankings.map((ranking, index) => (
                  <tr key={ranking.bridge} className="border-b">
                    <td className="py-3 font-medium">#{index + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {ranking.bridge.charAt(0)}
                        </div>
                        {ranking.bridge}
                      </div>
                    </td>
                    <td className="py-3">{formatCurrency(ranking.totalVolume)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${ranking.marketShare * 100}%` }}
                          />
                        </div>
                        {(ranking.marketShare * 100).toFixed(1)}%
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cross-Chain Flow Details */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Cross-Chain Flow Details</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium">Route</th>
                  <th className="pb-3 font-medium">Asset</th>
                  <th className="pb-3 font-medium">Bridge</th>
                  <th className="pb-3 font-medium">24h Volume</th>
                  <th className="pb-3 font-medium">Change</th>
                  <th className="pb-3 font-medium">Transactions</th>
                  <th className="pb-3 font-medium">Avg Size</th>
                </tr>
              </thead>
              <tbody>
                {data.flows.slice(0, 10).map((flow, index) => (
                  <tr key={`${flow.bridgeProtocol}-${flow.sourceChain}-${flow.targetChain}-${index}`} className="border-b">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getChainIcon(flow.sourceChain)}</span>
                        <span className="text-sm font-medium">{flow.sourceChain}</span>
                        <ArrowUpDown className="h-4 w-4 text-gray-400" />
                        <span className="text-lg">{getChainIcon(flow.targetChain)}</span>
                        <span className="text-sm font-medium">{flow.targetChain}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                        {flow.asset}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                        {flow.bridgeProtocol}
                      </span>
                    </td>
                    <td className="py-3 font-medium">{formatCurrency(flow.volume24h)}</td>
                    <td className="py-3">
                      <div className={`flex items-center gap-1 ${
                        flow.volumeChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {flow.volumeChange >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {formatPercent(flow.volumeChange)}
                      </div>
                    </td>
                    <td className="py-3">{flow.transactionCount.toLocaleString()}</td>
                    <td className="py-3">{formatCurrency(flow.avgTransactionSize)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Assets */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Top Cross-Chain Assets</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.assets.slice(0, 6).map((asset, index) => (
              <div key={asset.asset} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-lg">{asset.asset}</h4>
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Volume:</span>
                    <span className="text-sm font-medium">{formatCurrency(asset.totalVolume)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bridges:</span>
                    <span className="text-sm font-medium">{asset.bridgeCount}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      style={{ 
                        width: `${Math.min((asset.totalVolume / Math.max(...data.assets.map(a => a.totalVolume))) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}