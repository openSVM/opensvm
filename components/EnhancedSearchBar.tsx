'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isValidTransactionSignature, isValidSolanaAddress } from '@/lib/utils';
import { Card } from './ui/card';
import { networks } from './NetworksTable';

interface SearchSuggestion {
  type: 'address' | 'transaction' | 'token' | 'program';
  value: string;
  label?: string;
}

interface SearchSettings {
  networks: string[];
  dataTypes: ('transactions' | 'blocks' | 'programs' | 'tokens')[];
  sortBy: 'relevance' | 'date' | 'amount';
  sortOrder: 'asc' | 'desc';
  dateRange?: {
    start: string;
    end: string;
  };
  status?: 'success' | 'failed';
  minAmount?: number;
  maxAmount?: number;
}

export default function EnhancedSearchBar() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchSettings, setSearchSettings] = useState<SearchSettings>({
    networks: ['solana'], // Default to Solana network
    dataTypes: ['transactions', 'blocks', 'programs', 'tokens'], // Default to all data types
    sortBy: 'relevance',
    sortOrder: 'desc',
  });
  const router = useRouter();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close suggestions and settings on outside click
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node) && 
          !(event.target as HTMLElement).closest('.settings-toggle')) {
        setShowSettings(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        // Fetch suggestions based on the query and selected networks
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&networks=${searchSettings.networks.join(',')}`);
        if (!response.ok) { throw new Error('Failed to fetch suggestions'); }
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    };

    const debounceTimeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimeout);
  }, [query, searchSettings.networks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isLoading) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Check if query is a block number
      if (/^\d+$/.test(trimmedQuery)) {
        router.push(`/block/${trimmedQuery}`);
        return;
      }
      
      // Check if query is a transaction signature
      if (isValidTransactionSignature(trimmedQuery)) {
        window.location.href = `/tx/${trimmedQuery}`;
        return;
      }
      
      // Check if query is a valid Solana address
      if (isValidSolanaAddress(trimmedQuery)) {
        const response = await fetch(`/api/check-account-type?address=${encodeURIComponent(trimmedQuery)}`);
        const data = await response.json();
        
        switch (data.type) {
          case 'token':
            window.location.href = `/token/${trimmedQuery}`;
            break;
          case 'program':
            window.location.href = `/program/${trimmedQuery}`;
            break;
          case 'account':
            window.location.href = `/account/${trimmedQuery}`;
            break;
          default:
            // Build search URL with settings
            buildAndNavigateToSearchUrl(trimmedQuery);
        }
      } else {
        // Use search page with settings
        buildAndNavigateToSearchUrl(trimmedQuery);
      }
    } catch (error) {
      console.error('Error processing search:', error);
      buildAndNavigateToSearchUrl(trimmedQuery);
    } finally {
      setIsLoading(false);
    }
  };

  const buildAndNavigateToSearchUrl = (query: string) => {
    let searchUrl = `/search?q=${encodeURIComponent(query)}`;
    
    // Add networks
    if (searchSettings.networks.length > 0) {
      searchUrl += `&networks=${searchSettings.networks.join(',')}`;
    }
    
    // Add data types
    if (searchSettings.dataTypes.length > 0) {
      searchUrl += `&types=${searchSettings.dataTypes.join(',')}`;
    }
    
    // Add sort options
    searchUrl += `&sortBy=${searchSettings.sortBy}&sortOrder=${searchSettings.sortOrder}`;
    
    // Add date range
    if (searchSettings.dateRange?.start && searchSettings.dateRange?.end) {
      searchUrl += `&start=${searchSettings.dateRange.start}&end=${searchSettings.dateRange.end}`;
    }
    
    // Add status
    if (searchSettings.status) {
      searchUrl += `&status=${searchSettings.status}`;
    }
    
    // Add amount range
    if (searchSettings.minAmount !== undefined) {
      searchUrl += `&min=${searchSettings.minAmount}`;
    }
    if (searchSettings.maxAmount !== undefined) {
      searchUrl += `&max=${searchSettings.maxAmount}`;
    }
    
    router.push(searchUrl);
  };

  const toggleNetwork = (networkId: string) => {
    setSearchSettings(prev => {
      const networks = [...prev.networks];
      const index = networks.indexOf(networkId);
      
      if (index === -1) {
        networks.push(networkId);
      } else {
        networks.splice(index, 1);
      }
      
      return {
        ...prev,
        networks
      };
    });
  };

  const toggleDataType = (dataType: 'transactions' | 'blocks' | 'programs' | 'tokens') => {
    setSearchSettings(prev => {
      const dataTypes = [...prev.dataTypes];
      const index = dataTypes.indexOf(dataType);
      
      if (index === -1) {
        dataTypes.push(dataType);
      } else {
        dataTypes.splice(index, 1);
      }
      
      return {
        ...prev,
        dataTypes
      };
    });
  };

  const clearSearch = () => {
    setQuery('');
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative flex flex-col w-full gap-4">
        <div className="relative flex w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            placeholder="Search by address, transaction, block or token"
            className="w-full rounded-l-lg border border-r-0 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-[#00ffbd] focus:outline-none focus:ring-1 focus:ring-[#00ffbd]"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-[96px] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="settings-toggle px-4 py-3 border border-r-0 border-gray-200 bg-white text-gray-600 hover:text-gray-900 flex items-center justify-center"
            aria-label="Customize Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`rounded-r-lg bg-[#00ffbd] px-6 py-3 text-sm font-medium text-black hover:bg-[#00e6aa] flex items-center justify-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </div>
            ) : 'Search'}
          </button>
        </div>

        {/* Search Settings Panel */}
        {showSettings && (
          <div ref={settingsRef} className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Search Settings</h3>
                <button 
                  type="button" 
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Network Selection */}
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
                  </div>
                </div>
                
                {/* Data Type Filters */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">Filter by Data Type</h4>
                  <div className="space-y-2">
                    {['transactions', 'blocks', 'programs', 'tokens'].map((type) => (
                      <div key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`type-${type}`}
                          checked={searchSettings.dataTypes.includes(type as any)}
                          onChange={() => toggleDataType(type as any)}
                          className="h-4 w-4 text-[#00ffbd] focus:ring-[#00ffbd] border-gray-300 rounded"
                        />
                        <label htmlFor={`type-${type}`} className="ml-2 text-sm text-gray-700 capitalize">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Sort and Order */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">Sort Results</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="sort-by" className="block text-xs text-gray-500 mb-1">Sort By</label>
                      <select
                        id="sort-by"
                        value={searchSettings.sortBy}
                        onChange={(e) => setSearchSettings({
                          ...searchSettings,
                          sortBy: e.target.value as any
                        })}
                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                      >
                        <option value="relevance">Relevance</option>
                        <option value="date">Date</option>
                        <option value="amount">Amount</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="sort-order" className="block text-xs text-gray-500 mb-1">Order</label>
                      <select
                        id="sort-order"
                        value={searchSettings.sortOrder}
                        onChange={(e) => setSearchSettings({
                          ...searchSettings,
                          sortOrder: e.target.value as any
                        })}
                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                      >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Advanced Filters */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">Advanced Filters</h4>
                  <div className="space-y-2">
                    <div>
                      <label htmlFor="status-filter" className="block text-xs text-gray-500 mb-1">Status</label>
                      <select
                        id="status-filter"
                        value={searchSettings.status || ''}
                        onChange={(e) => setSearchSettings({
                          ...searchSettings,
                          status: e.target.value as any || undefined
                        })}
                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                      >
                        <option value="">All</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Date Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={searchSettings.dateRange?.start || ''}
                          onChange={(e) => setSearchSettings({
                            ...searchSettings,
                            dateRange: {
                              start: e.target.value,
                              end: searchSettings.dateRange?.end || ''
                            }
                          })}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                        />
                        <input
                          type="date"
                          value={searchSettings.dateRange?.end || ''}
                          onChange={(e) => setSearchSettings({
                            ...searchSettings,
                            dateRange: {
                              start: searchSettings.dateRange?.start || '',
                              end: e.target.value
                            }
                          })}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Amount Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={searchSettings.minAmount || ''}
                          onChange={(e) => setSearchSettings({
                            ...searchSettings,
                            minAmount: e.target.value ? parseFloat(e.target.value) : undefined
                          })}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={searchSettings.maxAmount || ''}
                          onChange={(e) => setSearchSettings({
                            ...searchSettings,
                            maxAmount: e.target.value ? parseFloat(e.target.value) : undefined
                          })}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setQuery(suggestion.value);
                  setShowSuggestions(false);
                  handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              >
                <span className="text-xs text-gray-500 uppercase">{suggestion.type}</span>
                <span className="flex-1 truncate">{suggestion.label || suggestion.value}</span>
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}