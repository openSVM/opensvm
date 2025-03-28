'use client';

import React from 'react';
import { networks } from '../NetworksTable';
import { SearchSettings } from './types';

interface NetworkSelectionProps {
  searchSettings: SearchSettings;
  toggleNetwork: (networkId: string) => void;
}

export const NetworkSelection: React.FC<NetworkSelectionProps> = ({
  searchSettings,
  toggleNetwork,
}) => {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-700">Select Networks</h4>
      <div className="space-y-2">
        {networks.map((network) => (
          <div key={network.id} className="flex items-center">
            <input
              type="checkbox"
              id={`network-${network.id}`}
              checked={searchSettings.networks.includes(network.id)}
              onChange={() => toggleNetwork(network.id)}
              className="h-4 w-4 text-[#00ffbd] focus:ring-[#00ffbd] border-gray-300 rounded"
            />
            <label htmlFor={`network-${network.id}`} className="ml-2 text-sm text-gray-700">
              {network.name}
            </label>
          </div>
        ))}
        {searchSettings.networks.length === 1 && (
          <p className="text-xs text-gray-500 mt-1">
            At least one network must be selected
          </p>
        )}
      </div>
    </div>
  );
};