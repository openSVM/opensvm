'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Shield, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Activity, Zap, Heart } from 'lucide-react';

interface DeFiHealthData {
  protocols: Array<{
    protocol: string;
    category: 'dex' | 'lending' | 'yield' | 'derivatives' | 'insurance';
    tvl: number;
    tvlChange24h: number;
    tvlChange7d: number;
    riskScore: number;
    healthScore: number;
    exploitAlerts: Array<{
      severity: 'critical' | 'high' | 'medium' | 'low';
      type: string;
      description: string;
      affectedAmount: number;
      timestamp: number;
    }>;
    treasuryHealth: {
      treasuryValue: number;
      runwayMonths: number;
      sustainabilityRisk: 'low' | 'medium' | 'high' | 'critical';
    };
  }>;
  alerts: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    description: string;
    affectedAmount: number;
    protocolsAffected: string[];
    timestamp: number;
  }>;
  rankings: Array<{
    protocol: string;
    tvl: number;
    healthScore: number;
    riskScore: number;
  }>;
  ecosystem: {
    totalTvl: number;
    avgHealthScore: number;
    avgRiskScore: number;
    criticalAlerts: number;
    protocolCount: number;
  };
  health: {
    isHealthy: boolean;
    lastUpdate: number;
    monitoredProtocols: number;
    activeAlerts: number;
  };
}

export function DeFiHealthTab() {
  const [data, setData] = useState<DeFiHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false); // New state for toggle loading

  const fetchDeFiHealthData = async () => {
    try {
      const response = await fetch('/api/analytics/defi-health');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch DeFi health data');
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
      const response = await fetch('/api/analytics/defi-health', {
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
      console.error('Error toggling DeFi health monitoring:', err);
      setError('Failed to toggle monitoring');
    } finally {
      setToggleLoading(false);
    }
  };

  useEffect(() => {
    fetchDeFiHealthData();
    const interval = setInterval(fetchDeFiHealthData, 45000); // Refresh every 45 seconds
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

  const getHealthScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    if (score >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskScoreColor = (score: number) => {
    if (score <= 0.2) return 'text-green-600';
    if (score <= 0.4) return 'text-yellow-600';
    if (score <= 0.6) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'dex': return 'bg-blue-100 text-blue-800';
      case 'lending': return 'bg-green-100 text-green-800';
      case 'yield': return 'bg-purple-100 text-purple-800';
      case 'derivatives': return 'bg-orange-100 text-orange-800';
      case 'insurance': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading DeFi health data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertTriangle className="h-8 w-8 mr-2" />
        <span>Error: {error}</span>
        <button
          onClick={fetchDeFiHealthData}
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
          <h2 className="text-2xl font-bold">DeFi Protocol Health Monitor</h2>
          <p className="text-gray-600">Real-time protocol health scores, exploit detection, and risk assessment</p>
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

      {/* Ecosystem Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total TVL</p>
              <p className="text-2xl font-bold">{formatCurrency(data.ecosystem.totalTvl)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Health</p>
              <p className={`text-2xl font-bold ${getHealthScoreColor(data.ecosystem.avgHealthScore)}`}>
                {(data.ecosystem.avgHealthScore * 100).toFixed(0)}%
              </p>
            </div>
            <Heart className="h-8 w-8 text-pink-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Risk</p>
              <p className={`text-2xl font-bold ${getRiskScoreColor(data.ecosystem.avgRiskScore)}`}>
                {(data.ecosystem.avgRiskScore * 100).toFixed(0)}%
              </p>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Protocols</p>
              <p className="text-2xl font-bold">{data.ecosystem.protocolCount}</p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-600">{data.ecosystem.criticalAlerts}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {data.alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Security Alerts
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data.alerts.map((alert, index) => (
                <div key={index} className="border rounded-lg p-4 border-red-200 bg-red-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium">{alert.type}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span>Affected Amount: <span className="font-medium">{formatCurrency(alert.affectedAmount)}</span></span>
                    <span>Protocols: <span className="font-medium">{alert.protocolsAffected.join(', ')}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Protocol Health Rankings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Protocol Health Rankings</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium">Rank</th>
                  <th className="pb-3 font-medium">Protocol</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">TVL</th>
                  <th className="pb-3 font-medium">24h Change</th>
                  <th className="pb-3 font-medium">Health Score</th>
                  <th className="pb-3 font-medium">Risk Score</th>
                  <th className="pb-3 font-medium">Treasury</th>
                  <th className="pb-3 font-medium">Alerts</th>
                </tr>
              </thead>
              <tbody>
                {data.protocols.slice(0, 15).map((protocol, index) => (
                  <tr key={protocol.protocol} className="border-b">
                    <td className="py-3 font-medium">#{index + 1}</td>
                    <td className="py-3 font-medium">{protocol.protocol}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getCategoryColor(protocol.category)}`}>
                        {protocol.category}
                      </span>
                    </td>
                    <td className="py-3">{formatCurrency(protocol.tvl)}</td>
                    <td className="py-3">
                      <div className={`flex items-center gap-1 ${
                        protocol.tvlChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {protocol.tvlChange24h >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {formatPercent(protocol.tvlChange24h)}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${protocol.healthScore * 100}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${getHealthScoreColor(protocol.healthScore)}`}>
                          {(protocol.healthScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-sm font-medium ${getRiskScoreColor(protocol.riskScore)}`}>
                        {(protocol.riskScore * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="text-sm">
                        <div>{formatCurrency(protocol.treasuryHealth.treasuryValue)}</div>
                        <div className="text-gray-500">{protocol.treasuryHealth.runwayMonths.toFixed(0)}mo runway</div>
                      </div>
                    </td>
                    <td className="py-3">
                      {protocol.exploitAlerts.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {protocol.exploitAlerts.slice(0, 2).map((alert, i) => (
                            <span key={i} className={`px-2 py-1 rounded text-xs ${getSeverityColor(alert.severity)}`}>
                              {alert.severity}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-green-600 text-sm">✓ Clean</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Health Score Distribution</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { range: '80-100%', color: 'bg-green-500', count: data.protocols.filter(p => p.healthScore >= 0.8).length },
                { range: '60-79%', color: 'bg-yellow-500', count: data.protocols.filter(p => p.healthScore >= 0.6 && p.healthScore < 0.8).length },
                { range: '40-59%', color: 'bg-orange-500', count: data.protocols.filter(p => p.healthScore >= 0.4 && p.healthScore < 0.6).length },
                { range: '0-39%', color: 'bg-red-500', count: data.protocols.filter(p => p.healthScore < 0.4).length }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${item.color}`} />
                    <span className="text-sm font-medium">{item.range}</span>
                  </div>
                  <span className="text-sm text-gray-600">{item.count} protocols</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Category Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(
                data.protocols.reduce((acc, protocol) => {
                  acc[protocol.category] = (acc[protocol.category] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getCategoryColor(category)}`}>
                    {category}
                  </span>
                  <span className="text-sm text-gray-600">{count} protocols</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}