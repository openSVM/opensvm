'use client';

import React, { useState } from 'react';
import { SolanaDEXTab } from '@/components/solana/solana-dex-tab';
import { CrossChainTab } from '@/components/solana/cross-chain-tab';

type TabType = 'overview' | 'dex' | 'cross-chain' | 'defi-health' | 'validators';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', description: 'Network overview and key metrics' },
    { id: 'dex' as TabType, label: 'Solana DEX', description: 'DEX volume, liquidity, and arbitrage' },
    { id: 'cross-chain' as TabType, label: 'Cross-Chain', description: 'Bridge flows and migrations' },
    { id: 'defi-health' as TabType, label: 'DeFi Health', description: 'Protocol health and risk monitoring', comingSoon: true },
    { id: 'validators' as TabType, label: 'Validators', description: 'Validator performance and decentralization', comingSoon: true },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Network Performance</h3>
                <p className="text-gray-600 mb-4">Real-time Solana network metrics</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>TPS:</span>
                    <span className="font-medium">~2,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Validators:</span>
                    <span className="font-medium">1,500+</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Supply:</span>
                    <span className="font-medium">580M SOL</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">DeFi Ecosystem</h3>
                <p className="text-gray-600 mb-4">Total Value Locked across protocols</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total TVL:</span>
                    <span className="font-medium">$2.1B</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Protocols:</span>
                    <span className="font-medium">50+</span>
                  </div>
                  <div className="flex justify-between">
                    <span>24h Volume:</span>
                    <span className="font-medium">$450M</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Cross-Chain Activity</h3>
                <p className="text-gray-600 mb-4">Bridge flows and asset migrations</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Active Bridges:</span>
                    <span className="font-medium">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>24h Volume:</span>
                    <span className="font-medium">$85M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Top Asset:</span>
                    <span className="font-medium">USDC</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('dex')}
                  className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <h4 className="font-medium text-blue-900">Explore DEX Analytics</h4>
                  <p className="text-sm text-blue-700">View live DEX data and arbitrage opportunities</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('cross-chain')}
                  className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <h4 className="font-medium text-green-900">Cross-Chain Flows</h4>
                  <p className="text-sm text-green-700">Monitor bridge activity and migrations</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('defi-health')}
                  className="p-4 text-left bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                >
                  <h4 className="font-medium text-yellow-900">DeFi Health Monitor</h4>
                  <p className="text-sm text-yellow-700">Track protocol health and risks</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('validators')}
                  className="p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <h4 className="font-medium text-purple-900">Validator Analytics</h4>
                  <p className="text-sm text-purple-700">Analyze validator performance and stake</p>
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'dex':
        return <SolanaDEXTab />;
      
      case 'cross-chain':
        return <CrossChainTab />;
      
      case 'defi-health':
        return (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-4">DeFi Protocol Health Monitor</h3>
            <p className="text-gray-600 mb-4">Protocol health scores, exploit detection, and risk assessment</p>
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
              Coming in Phase 3 - DeFi Health Monitoring
            </div>
          </div>
        );
      
      case 'validators':
        return (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-4">Validator Performance Analytics</h3>
            <p className="text-gray-600 mb-4">Validator metrics, performance tracking, and network decentralization</p>
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
              Coming in Phase 4 - Validator Analytics
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Solana Ecosystem Analytics</h1>
        <p className="text-gray-600">
          Comprehensive analytics for DEXes, cross-chain flows, DeFi protocols, and validator performance.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${tab.comingSoon ? 'opacity-60' : ''}`}
                disabled={tab.comingSoon}
              >
                <div className="flex flex-col items-center">
                  <span>{tab.label}</span>
                  {tab.comingSoon && (
                    <span className="text-xs text-gray-400 mt-1">Coming Soon</span>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
}
