'use client';

import React, { useState } from 'react';
import { SolanaDEXTab } from '@/components/solana/solana-dex-tab';
import { CrossChainTab } from '@/components/solana/cross-chain-tab';
import { DeFiHealthTab } from '@/components/solana/defi-health-tab';
import { ValidatorTab } from '@/components/solana/validator-tab';

type TabType = 'overview' | 'dex' | 'cross-chain' | 'defi-health' | 'validators';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', description: 'Network overview and key metrics' },
    { id: 'dex' as TabType, label: 'Solana DEX', description: 'DEX volume, liquidity, and arbitrage' },
    { id: 'cross-chain' as TabType, label: 'Cross-Chain', description: 'Bridge flows and migrations' },
    { id: 'defi-health' as TabType, label: 'DeFi Health', description: 'Protocol health and risk monitoring' },
    { id: 'validators' as TabType, label: 'Validators', description: 'Validator performance and decentralization' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-background border p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Network Performance</h3>
                <p className="text-muted-foreground mb-4">Real-time Solana network metrics</p>
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
              
              <div className="bg-background border p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">DeFi Ecosystem</h3>
                <p className="text-muted-foreground mb-4">Total Value Locked across protocols</p>
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
              
              <div className="bg-background border p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Cross-Chain Activity</h3>
                <p className="text-muted-foreground mb-4">Bridge flows and asset migrations</p>
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
            
            <div className="bg-background border p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('dex')}
                  className="p-4 text-left bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                >
                  <h4 className="font-medium text-primary">Explore DEX Analytics</h4>
                  <p className="text-sm text-muted-foreground">View live DEX data and arbitrage opportunities</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('cross-chain')}
                  className="p-4 text-left bg-secondary/50 hover:bg-secondary/70 rounded-lg transition-colors"
                >
                  <h4 className="font-medium text-secondary-foreground">Cross-Chain Flows</h4>
                  <p className="text-sm text-muted-foreground">Monitor bridge activity and migrations</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('defi-health')}
                  className="p-4 text-left bg-accent/20 hover:bg-accent/30 rounded-lg transition-colors"
                >
                  <h4 className="font-medium text-accent-foreground">DeFi Health Monitor</h4>
                  <p className="text-sm text-muted-foreground">Track protocol health and risks</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('validators')}
                  className="p-4 text-left bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  <h4 className="font-medium text-foreground">Validator Analytics</h4>
                  <p className="text-sm text-muted-foreground">Analyze validator performance and stake</p>
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
        return <DeFiHealthTab />;
      
      case 'validators':
        return <ValidatorTab />;
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Solana Ecosystem Analytics</h1>
        <p className="text-muted-foreground">&nbsp;
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
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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
