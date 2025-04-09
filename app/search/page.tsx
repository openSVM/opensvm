// Modify existing search page to include AI enhancements
'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import EnhancedSearchBar from '@/components/EnhancedSearchBar';
import { Select } from '@/components/ui/select';
import { sanitizeSearchQuery, formatNumber, isValidSolanaAddress, isValidTransactionSignature } from '@/lib/utils';

interface SearchResult {
  address: string;
  balance?: number;
  type?: string;
  timestamp?: string;
  status?: 'success' | 'failed';
  amount?: number;
}

interface SearchState {
  currentPage: number;
  itemsPerPage: number;
  sortField: string;
  sortDirection: 'asc' | 'desc';
}

function SearchResults() {
  const [searchState, setSearchState] = useState<SearchState>({
    currentPage: 1,
    itemsPerPage: 25,
    sortField: 'timestamp',
    sortDirection: 'desc'
  });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // AI Response States
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isAiStreaming, setIsAiStreaming] = useState<boolean>(false);
  const [aiStreamComplete, setAiStreamComplete] = useState<boolean>(false);
  const [aiSources, setAiSources] = useState<{title: string, url: string}[]>([]);
  const [showAiPanel, setShowAiPanel] = useState<boolean>(true);

  // Handle redirects on mount
  useEffect(() => {
    async function handleRedirect() {
      if (!query) return;

      setIsLoading(true);
      try {
        // Check if query is a block number
        if (/^\d+$/.test(query)) {
          router.push(`/block/${query}`);
          return;
        }
        
        // Check if query is a transaction signature (88 chars)
        if (isValidTransactionSignature(query)) {
          router.push(`/tx/${query}`);
          return;
        }
        
        // Check if query is a valid Solana address
        if (isValidSolanaAddress(query)) {
          try {
            // Check account type using API
            const response = await fetch(`/api/check-account-type?address=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            switch (data.type) {
              case 'token':
                console.log('Redirecting to token page:', query);
                router.push(`/token/${query}`);
                return;
              case 'program':
                console.log('Redirecting to program page:', query);
                router.push(`/program/${query}`);
                return;
              case 'account':
              default:
                console.log('Redirecting to account page:', query);
                router.push(`/account/${query}`);
                return;
            }
          } catch (error) {
            console.error('Error checking account type:', error);
            // On error, default to account page
            router.push(`/account/${query}`);
            return;
          }
        }
      } finally {
        setIsLoading(false);
      }
    }

    handleRedirect();
  }, [query, router]);
  
  // Handle general search
  useEffect(() => {
    async function performSearch() {
      if (!query) {
        setSearchResults(null);
        return;
      }

      const sanitizedQuery = sanitizeSearchQuery(query);
      if (!sanitizedQuery) {
        setSearchResults(null);
        return;
      }

      try {
        setIsLoading(true);
        
        // Build URL with filters
        let searchUrl = `/api/search/filtered?q=${encodeURIComponent(sanitizedQuery)}`;
        const searchParams = new URLSearchParams(window.location.search);
        
        // Add filters from URL if present
        if (searchParams.get('start')) searchUrl += `&start=${searchParams.get('start')}`;
        if (searchParams.get('end')) searchUrl += `&end=${searchParams.get('end')}`;
        if (searchParams.get('type')) searchUrl += `&type=${searchParams.get('type')}`;
        if (searchParams.get('status')) searchUrl += `&status=${searchParams.get('status')}`;
        if (searchParams.get('min')) searchUrl += `&min=${searchParams.get('min')}`;
        if (searchParams.get('max')) searchUrl += `&max=${searchParams.get('max')}`;
        
        const response = await fetch(searchUrl);
        if (!response.ok) throw new Error('Failed to fetch results');
        const results = await response.json();
        
        if (results.error) {
          setError(results.error);
          setSearchResults([]);
        } else {
          setSearchResults(results);
          setError(null);
        }
      } catch (e) {
        setError('Failed to perform search');
        console.error(e);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [query]);
  
  // AI Response Generation
  useEffect(() => {
    if (!query) return;
    
    // Reset AI states
    setAiResponse('');
    setAiSources([]);
    setAiStreamComplete(false);
    
    // Simulate AI thinking state
    setIsAiThinking(true);
    
    // Simulate API call delay
    const thinkingTimer = setTimeout(() => {
      setIsAiThinking(false);
      setIsAiStreaming(true);
      
      // Simulate streaming response
      let fullResponse = generateAiResponseForQuery(query);
      let currentIndex = 0;
      
      const streamInterval = setInterval(() => {
        if (currentIndex < fullResponse.length) {
          setAiResponse(prev => prev + fullResponse[currentIndex]);
          currentIndex++;
        } else {
          clearInterval(streamInterval);
          setIsAiStreaming(false);
          setAiStreamComplete(true);
          
          // Add sources after streaming completes
          setAiSources([
            { title: 'Solana Documentation', url: 'https://docs.solana.com' },
            { title: 'Solana Explorer', url: 'https://explorer.solana.com' },
            { title: 'OpenSVM GitHub', url: 'https://github.com/aldrin-labs/opensvm' }
          ]);
        }
      }, 15); // Stream characters at a natural typing speed
      
      return () => {
        clearTimeout(thinkingTimer);
        clearInterval(streamInterval);
      };
    }, 1500);
    
    return () => clearTimeout(thinkingTimer);
  }, [query]);
  
  // Function to generate a response based on the query
  const generateAiResponseForQuery = (query: string): string => {
    // This would be replaced with actual AI response generation
    return `Based on your search for "${query}", I found relevant information in the Solana blockchain.

The query appears to be related to ${query.includes('transaction') ? 'a transaction' : query.includes('token') ? 'a token' : 'an account or program'} on the Solana network.

Here's what you should know:
- Solana is a high-performance blockchain supporting smart contracts and decentralized applications
- Transactions on Solana are processed quickly with low fees
- The Solana Virtual Machine (SVM) executes programs written in Rust, C, and C++

For more detailed information, you can explore the search results below or check the provided sources.`;
  };

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Please enter a search query</h1>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Loading...</h1>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Loading Results</h2>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSort = (field: string) => {
    setSearchState(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (page: number) => {
    setSearchState(prev => ({
      ...prev,
      currentPage: page
    }));
  };

  const handleItemsPerPageChange = (items: number) => {
    setSearchState(prev => ({
      ...prev,
      itemsPerPage: items,
      currentPage: 1
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <EnhancedSearchBar />
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Search Results for "{query}"</h1>
      
      {/* AI Response Panel */}
      {showAiPanel && (
        <Card className="mb-6 overflow-hidden animate-in fade-in-0 slide-in-from-top-2">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">AI-Enhanced Results</h3>
              {(isAiThinking || isAiStreaming) && (
                <div className="flex items-center text-sm text-muted-foreground">
                  {isAiThinking ? (
                    <>
                      <div className="flex space-x-1 mr-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '600ms' }}></div>
                      </div>
                      Thinking...
                    </>
                  ) : (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating response...
                    </>
                  )}
                </div>
              )}
              <button 
                onClick={() => setShowAiPanel(false)}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {isAiThinking ? (
              <div className="h-24 flex items-center justify-center">
                <div className="text-muted-foreground">Analyzing your query and searching for relevant information...</div>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none">
                {aiResponse.split('\n\n').map((paragraph, index) => (
                  <p key={index} className={aiStreamComplete ? '' : 'border-r-2 border-primary animate-pulse'}>
                    {paragraph}
                  </p>
                ))}
                {!aiStreamComplete && isAiStreaming && (
                  <span className="inline-block w-1 h-4 bg-primary animate-pulse"></span>
                )}
              </div>
            )}
          </CardContent>
          {aiStreamComplete && aiSources.length > 0 && (
            <CardFooter className="bg-muted/30 border-t p-4">
              <div className="w-full">
                <h4 className="text-sm font-medium mb-2">Sources:</h4>
                <div className="flex flex-wrap gap-2">
                  {aiSources.map((source, index) => (
                    <a 
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors duration-200"
                    >
                      {source.title}
                    </a>
                  ))}
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      )}
      
      {/* Results Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Select
            value={searchState.itemsPerPage.toString()}
            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
          >
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </Select>
          
          {/* Search Source Tabs */}
          <div className="flex border rounded-lg overflow-hidden">
            <button className="px-3 py-1 bg-primary text-primary-foreground">SVM</button>
            <button className="px-3 py-1 hover:bg-muted transition-colors duration-200">Telegram</button>
            <button className="px-3 py-1 hover:bg-muted transition-colors duration-200">DuckDuckGo</button>
            <button className="px-3 py-1 hover:bg-muted transition-colors duration-200">X.com</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Page {searchState.currentPage} of {Math.ceil((searchResults?.length || 0) / searchState.itemsPerPage)}
          </span>
          <button
            onClick={() => handlePageChange(searchState.currentPage - 1)}
            disabled={searchState.currentPage === 1}
            className="px-3 py-1 rounded border disabled:opacity-50 transition-opacity duration-200"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(searchState.currentPage + 1)}
            disabled={searchState.currentPage >= Math.ceil((searchResults?.length || 0) / searchState.itemsPerPage)}
            className="px-3 py-1 rounded border disabled:opacity-50 transition-opacity duration-200"
          >
            Next
          </button>
        </div>
      </div>
      
      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Results</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleSort('timestamp')}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200"
                  >
                    Date {searchState.sortField === 'timestamp' && (searchState.sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    onClick={() => handleSort('amount')}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200"
                  >
                    Amount {searchState.sortField === 'amount' && (searchState.sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    onClick={() => handleSort('type')}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200"
                  >
                    Type {searchState.sortField === 'type' && (searchState.sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {searchResults?.error ? (
                <p className="text-red-500">{searchResults.error}</p>
              ) : searchResults?.length ? (
                <div className="space-y-4">
                  {searchResults
                    .sort((a: SearchResult, b: SearchResult) => {
                      const aValue = a[searchState.sortField as keyof SearchResult];
                      const bValue = b[searchState.sortField as keyof SearchResult];
                      if (!aValue || !bValue) return 0;
                      return searchState.sortDirection === 'asc' 
                        ? aValue > bValue ? 1 : -1
                        : aValue < bValue ? 1 : -1;
                    })
                    .slice(
                      (searchState.currentPage - 1) * searchState.itemsPerPage,
                      searchState.currentPage * searchState.itemsPerPage
                    )
                    .map((result: SearchResult) => (
                      <div 
                        key={result.address}
                        className="border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md"
                      >
                        <div 
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setExpandedRow(expandedRow === result.address ? null : result.address)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="font-mono text-sm">{result.address}</p>
                              {result.balance && (
                                <p className="text-sm text-gray-500">Balance: {formatNumber(result.balance)} SOL</p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              {result.type && (
                                <span className="px-2 py-1 text-xs rounded bg-gray-100">{result.type}</span>
                              )}
                              {result.status && (
                                <span className={`px-2 py-1 text-xs rounded ${
                                  result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                } transition-colors duration-200`}>
                                  {result.status}
                                </span>
                              )}
                              {result.amount && (
                                <span className="text-sm font-medium">{formatNumber(result.amount)} SOL</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded Details */}
                        {expandedRow === result.address && (
                          <div className="p-4 bg-gray-50 border-t animate-in fade-in-0 slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Timestamp</h4>
                                <p className="text-sm">{result.timestamp || 'N/A'}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Type</h4>
                                <p className="text-sm">{result.type || 'N/A'}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                                <p className="text-sm">{result.status || 'N/A'}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Amount</h4>
                                <p className="text-sm">{result.amount ? `${formatNumber(result.amount)} SOL` : 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">No results found</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Loading...</h1>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Loading Results</h2>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
