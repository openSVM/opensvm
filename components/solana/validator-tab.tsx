'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, Server, TrendingUp, TrendingDown, MapPin, Users, Zap, Shield } from 'lucide-react';

interface ValidatorData {
  validators: Array<{
    voteAccount: string;
    name: string;
    commission: number;
    activatedStake: number;
    lastVote: number;
    rootSlot: number;
    credits: number;
    epochCredits: number;
    version: string;
    status: 'active' | 'delinquent' | 'inactive';
    datacenter?: string;
    country?: string;
    apy: number;
    performanceScore: number;
    uptimePercent: number;
  }>;
  networkStats: {
    totalValidators: number;
    activeValidators: number;
    delinquentValidators: number;
    totalStake: number;
    averageCommission: number;
    nakamotoCoefficient: number;
    averageUptime: number;
    networkHealth: 'excellent' | 'good' | 'fair' | 'poor';
  };
  decentralization: {
    geograficDistribution: Array<{
      country: string;
      validatorCount: number;
      stakePercent: number;
    }>;
    datacenterDistribution: Array<{
      datacenter: string;
      validatorCount: number;
      stakePercent: number;
    }>;
    clientDistribution: Array<{
      version: string;
      validatorCount: number;
      percent: number;
    }>;
  };
  health: {
    isHealthy: boolean;
    lastUpdate: number;
    monitoredValidators: number;
    issues: string[];
  };
}

export function ValidatorTab() {
  const router = useRouter();
  const [data, setData] = useState<ValidatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'stake' | 'commission' | 'performance' | 'uptime'>('stake');

  const fetchValidatorData = async () => {
    try {
      const response = await fetch('/api/analytics/validators');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch validator data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const toggleMonitoring = async () => {
    if (toggleLoading) return;
    
    setToggleLoading(true);
    try {
      const action = monitoringActive ? 'stop_monitoring' : 'start_monitoring';
      const response = await fetch('/api/analytics/validators', {
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
      console.error('Error toggling validator monitoring:', err);
      setError('Failed to toggle monitoring');
    } finally {
      setToggleLoading(false);
    }
  };

  useEffect(() => {
    fetchValidatorData();
    const interval = setInterval(fetchValidatorData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const formatSOL = (lamports: number) => {
    const sol = lamports / 1e9; // Convert lamports to SOL
    if (sol >= 1e6) return `${(sol / 1e6).toFixed(2)}M SOL`;
    if (sol >= 1e3) return `${(sol / 1e3).toFixed(2)}K SOL`;
    return `${sol.toFixed(2)} SOL`;
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'delinquent': return 'text-orange-600 bg-orange-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 0.95) return 'text-green-600';
    if (score >= 0.85) return 'text-yellow-600';
    if (score >= 0.7) return 'text-orange-600';
    return 'text-red-600';
  };

  const sortValidators = (validators: any[]) => {
    return [...validators].sort((a, b) => {
      switch (sortBy) {
        case 'stake':
          return b.activatedStake - a.activatedStake;
        case 'commission':
          return a.commission - b.commission;
        case 'performance':
          return b.performanceScore - a.performanceScore;
        case 'uptime':
          return b.uptimePercent - a.uptimePercent;
        default:
          return 0;
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading validator data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertTriangle className="h-8 w-8 mr-2" />
        <span>Error: {error}</span>
        <button
          onClick={fetchValidatorData}
          className="ml-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
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

  const sortedValidators = sortValidators(data.validators);

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Validator Performance Analytics</h2>
          <p className="text-muted-foreground">Real-time validator metrics, performance tracking, and network decentralization</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMonitoring}
            disabled={toggleLoading}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
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

      {/* Network Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background border rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Validators</p>
              <p className="text-2xl font-bold">{data.networkStats.activeValidators}</p>
              <p className="text-xs text-muted-foreground">of {data.networkStats.totalValidators} total</p>
            </div>
            <Server className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-background border rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Stake</p>
              <p className="text-2xl font-bold">{formatSOL(data.networkStats.totalStake)}</p>
              <p className="text-xs text-muted-foreground">across all validators</p>
            </div>
            <Zap className="h-8 w-8 text-accent" />
          </div>
        </div>

        <div className="bg-background border rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nakamoto Coefficient</p>
              <p className="text-2xl font-bold">{data.networkStats.nakamotoCoefficient}</p>
              <p className="text-xs text-muted-foreground">validators to halt network</p>
            </div>
            <Shield className="h-8 w-8 text-secondary" />
          </div>
        </div>

        <div className="bg-background border rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Uptime</p>
              <p className={`text-2xl font-bold ${getPerformanceColor(data.networkStats.averageUptime)}`}>
                {formatPercent(data.networkStats.averageUptime)}
              </p>
              <p className="text-xs text-muted-foreground">network wide</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Validator Rankings */}
      <div className="bg-background border rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Validator Rankings</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border rounded px-3 py-1 text-sm bg-background"
              >
                <option value="stake">Activated Stake</option>
                <option value="commission">Commission</option>
                <option value="performance">Performance</option>
                <option value="uptime">Uptime</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium">Rank</th>
                  <th className="pb-3 font-medium">Validator</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Activated Stake</th>
                  <th className="pb-3 font-medium">Commission</th>
                  <th className="pb-3 font-medium">APY</th>
                  <th className="pb-3 font-medium">Performance</th>
                  <th className="pb-3 font-medium">Uptime</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Version</th>
                </tr>
              </thead>
              <tbody>
                {sortedValidators.slice(0, 50).map((validator, index) => (
                  <tr key={validator.voteAccount} className="border-b hover:bg-muted/50">
                    <td className="py-3 font-medium">#{index + 1}</td>
                    <td className="py-3">
                      <div>
                        <div className="font-medium">{validator.name || 'Unknown'}</div>
                        <button
                          onClick={() => router.push(`/validator/${validator.voteAccount}`)}
                          className="text-xs text-primary hover:text-primary/80 font-mono underline cursor-pointer"
                        >
                          {validator.voteAccount.slice(0, 8)}...{validator.voteAccount.slice(-8)}
                        </button>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(validator.status)}`}>
                        {validator.status}
                      </span>
                    </td>
                    <td className="py-3">{formatSOL(validator.activatedStake)}</td>
                    <td className="py-3">{formatPercent(validator.commission / 100)}</td>
                    <td className="py-3">
                      <div className={`font-medium ${
                        validator.apy >= 7 ? 'text-green-600' : 
                        validator.apy >= 5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {validator.apy.toFixed(2)}%
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${validator.performanceScore * 100}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getPerformanceColor(validator.performanceScore)}`}>
                          {formatPercent(validator.performanceScore)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`font-medium ${getPerformanceColor(validator.uptimePercent / 100)}`}>
                        {validator.uptimePercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {validator.country || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {validator.datacenter || 'Unknown DC'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-sm font-mono">{validator.version}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Decentralization Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background border rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Geographic Distribution</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data.decentralization.geograficDistribution.slice(0, 8).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.country}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{item.validatorCount}</span>
                    <div className="text-xs text-muted-foreground">{formatPercent(item.stakePercent)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-background border rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Datacenter Distribution</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data.decentralization.datacenterDistribution.slice(0, 8).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.datacenter}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{item.validatorCount}</span>
                    <div className="text-xs text-muted-foreground">{formatPercent(item.stakePercent)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-background border rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Client Distribution</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data.decentralization.clientDistribution.slice(0, 8).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium font-mono">{item.version}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{item.validatorCount}</span>
                    <div className="text-xs text-muted-foreground">{formatPercent(item.percent)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}