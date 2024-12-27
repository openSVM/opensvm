'use client';

import { useState } from 'react';

interface NetworkMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

const NETWORK_METRICS: NetworkMetric[] = [
  {
    label: 'Average TPS',
    value: '4,819',
    change: '+12.5%',
    trend: 'up'
  },
  {
    label: 'Daily Transactions',
    value: '245.7M',
    change: '+8.2%',
    trend: 'up'
  },
  {
    label: 'Active Accounts',
    value: '1.2M',
    change: '+5.4%',
    trend: 'up'
  },
  {
    label: 'Total Value Locked',
    value: '$1.85B',
    change: '-2.1%',
    trend: 'down'
  }
];

const PROGRAM_STATS = [
  {
    name: 'Jupiter',
    transactions: '12.5M',
    volume: '$458.2M',
    fees: '$125.4K'
  },
  {
    name: 'Raydium',
    transactions: '8.2M',
    volume: '$245.7M',
    fees: '$89.2K'
  },
  {
    name: 'Orca',
    transactions: '6.7M',
    volume: '$198.4M',
    fees: '$67.8K'
  }
];

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Network Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {NETWORK_METRICS.map((metric) => (
            <div key={metric.label} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-500 mb-1">{metric.label}</div>
              <div className="text-2xl font-medium text-gray-900">{metric.value}</div>
              <div className={`text-sm mt-1 ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 
                'text-gray-500'
              }`}>
                {metric.change} vs last week
              </div>
            </div>
          ))}
        </div>

        {/* Program Statistics */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Top Programs (24h)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Program</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Transactions</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Volume</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Fees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {PROGRAM_STATS.map((program) => (
                  <tr key={program.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{program.name}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {program.transactions}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {program.volume}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {program.fees}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Network Health */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Network Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Block Time</div>
              <div className="text-2xl font-medium text-gray-900">400ms</div>
              <div className="w-full bg-gray-200 h-1 mt-2">
                <div className="bg-green-500 h-1" style={{ width: '95%' }} />
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Validator Health</div>
              <div className="text-2xl font-medium text-gray-900">99.98%</div>
              <div className="w-full bg-gray-200 h-1 mt-2">
                <div className="bg-green-500 h-1" style={{ width: '99.98%' }} />
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Success Rate</div>
              <div className="text-2xl font-medium text-gray-900">99.82%</div>
              <div className="w-full bg-gray-200 h-1 mt-2">
                <div className="bg-green-500 h-1" style={{ width: '99.82%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 