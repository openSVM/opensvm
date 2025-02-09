"use client";

import { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TokensTab from './TokensTab';
import TransfersTab from './TransfersTab';
import PlaceholderTab from './PlaceholderTab';

export const tabs = [
  { id: 'tokens', label: 'Tokens' },
  { id: 'transfers', label: 'Transfers' },
  { id: 'nfts', label: 'NFTs' },
  { id: 'programs', label: 'Programs' },
];

interface Props {
  address: string;
  activeTab: string;
  solBalance: number;
  tokenBalances: { mint: string; balance: number; }[];
}

function TabContainerComponent({ address, activeTab, solBalance, tokenBalances }: Props) {
  const router = useRouter();

  const handleTabChange = useCallback((tabId: string) => {
    router.push(`/account/${address}?tab=${tabId}`);
  }, [address, router]);

  const renderTabs = () => (
    <div className="flex space-x-4 mb-4 border-b border-gray-200">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={`px-4 py-2 -mb-px ${
            activeTab === tab.id 
              ? 'text-blue-500 border-b-2 border-blue-500 font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'tokens':
        return <TokensTab address={address} tokenBalances={tokenBalances} />;
      case 'transfers':
        return (
          <div className="w-full">
            <TransfersTab address={address} />
          </div>
        );
      default:
        return <PlaceholderTab />;
    }
  };

  return (
    <div className="mt-6 w-full">
      {renderTabs()}
      {renderContent()}
    </div>
  );
}

export default memo(TabContainerComponent);
