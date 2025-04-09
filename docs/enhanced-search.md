# Enhanced Multi-SVM Search Documentation

This documentation covers the enhancements made to the OpenSVM search functionality, including smooth animations, AI enhancements, and integration with multiple search sources.

## Table of Contents

1. [Overview](#overview)
2. [New Features](#new-features)
3. [Architecture](#architecture)
4. [Components](#components)
5. [Search Sources](#search-sources)
6. [Performance Optimizations](#performance-optimizations)
7. [Usage Examples](#usage-examples)
8. [API Reference](#api-reference)

## Overview

The enhanced multi-SVM search provides a unified search experience across multiple data sources, including Solana blockchain data (via SVM and Moralis API), social media (Telegram and X.com), and web search (DuckDuckGo). The interface features smooth animations, AI-enhanced results similar to Perplexity, and a responsive design.

## New Features

### Smooth Animations
- Fade-in/out transitions for search results
- Slide animations for expanding/collapsing content
- Loading state animations
- Hover effects for interactive elements

### AI Enhancements
- Perplexity-like streaming response UI
- Thinking/processing state visualization
- Citation and source highlighting
- Contextual suggestions based on search results

### Multi-Source Search
- Solana Virtual Machine (SVM) data
- Moralis API integration for enhanced blockchain data
- Telegram chat search
- DuckDuckGo web search
- X.com (Twitter) search

### Performance Optimizations
- Result caching to reduce redundant API calls
- Request debouncing to prevent excessive API calls
- Batched search requests for better resource utilization
- Lazy loading of search results
- Image optimization for faster loading

## Architecture

The enhanced search functionality follows a modular architecture with separate components for each search source and shared utilities for common functionality.

```
lib/
├── moralis-api.ts         # Moralis API integration for Solana data
├── telegram-search.ts     # Telegram chat search functionality
├── duckduckgo-search.ts   # DuckDuckGo web search integration
├── xcom-search.ts         # X.com (Twitter) search integration
├── unified-search.ts      # Unified search interface combining all sources
└── search-optimization.ts # Performance optimizations
```

## Components

### SearchInput
Enhanced search input with animations and improved user experience.

### AIResponsePanel
Displays AI-generated insights about search results with a streaming interface similar to Perplexity.

### SearchSuggestions
Provides contextual suggestions as the user types.

### SearchSettings
Configurable search settings with animated transitions.

### SearchButton
Enhanced search button with loading animations.

## Search Sources

### SVM (Solana Virtual Machine)
The primary search source for blockchain data, providing information about:
- Accounts
- Transactions
- Tokens
- Programs

### Moralis API
Enhances blockchain data with additional context:
- Token pair statistics
- NFT metadata
- Portfolio information
- Token balances

### Telegram
Searches public Telegram chats for relevant discussions about the search query.

### DuckDuckGo
Provides web search results related to the query.

### X.com (Twitter)
Searches X.com for relevant posts and discussions.

## Performance Optimizations

### Caching
```typescript
// Example of using the cache
const cacheKey = generateCacheKey(query, options);
let results = getCachedResults(cacheKey);

if (!results) {
  results = await performSearch(query, options);
  cacheResults(cacheKey, results);
}
```

### Debouncing
```typescript
// Example of debounced search
const debouncedSearch = debounce(performSearch, 300);
inputElement.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});
```

### Lazy Loading
```typescript
// Example of lazy loading results
const loader = createLazyLoader(allResults);
const initialResults = loader.getCurrentPage();

// When user scrolls to bottom
if (loader.hasMoreResults()) {
  const nextPageResults = loader.loadNextPage();
  displayResults(nextPageResults);
}
```

## Usage Examples

### Basic Search
```typescript
import { unifiedSearch } from '../lib/unified-search';

// Search across all sources
const results = await unifiedSearch('Solana NFT', {
  sources: ['all'],
  limit: 10,
  sortBy: 'relevance',
  sortOrder: 'desc'
});

// Display results
console.log(`Found ${results.combined.length} results`);
```

### Source-Specific Search
```typescript
// Search only Telegram and X.com
const socialResults = await unifiedSearch('Solana NFT', {
  sources: ['telegram', 'xcom'],
  limit: 10,
  sortBy: 'date',
  sortOrder: 'desc'
});

console.log(`Found ${socialResults.sources.telegram.length} Telegram results`);
console.log(`Found ${socialResults.sources.xcom.length} X.com results`);
```

## API Reference

### Unified Search
```typescript
unifiedSearch(query: string, options?: SearchOptions): Promise<{
  query: string;
  sources: {
    svm: UnifiedSearchResult[];
    telegram: UnifiedSearchResult[];
    duckduckgo: UnifiedSearchResult[];
    xcom: UnifiedSearchResult[];
  };
  combined: UnifiedSearchResult[];
}>
```

#### SearchOptions
```typescript
interface SearchOptions {
  sources?: ('svm' | 'telegram' | 'duckduckgo' | 'xcom' | 'all')[];
  limit?: number;
  sortBy?: 'relevance' | 'date';
  sortOrder?: 'asc' | 'desc';
}
```

### Moralis API
```typescript
// Get token pair statistics
getTokenPairStats(network: 'mainnet' | 'devnet', address: string): Promise<any>

// Get NFT metadata
getNFTMetadata(network: 'mainnet' | 'devnet', address: string): Promise<any>

// Get portfolio for an address
getPortfolio(network: 'mainnet' | 'devnet', address: string, nftMetadata?: boolean): Promise<any>

// Enrich search results with Moralis data
enrichSearchResultsWithMoralisData(query: string, results: any[]): Promise<any[]>
```

### Search Optimization
```typescript
// Cache management
getCachedResults(cacheKey: string): any | null
cacheResults(cacheKey: string, results: any): void
generateCacheKey(query: string, options: any): string
clearExpiredCache(): void

// Debouncing
debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void

// Batching
batchSearchRequests<T>(requests: Array<() => Promise<T>>): Promise<T[]>

// Lazy loading
createLazyLoader(allResults: any[], pageSize?: number): {
  getCurrentPage(): any[];
  loadNextPage(): any[];
  hasMoreResults(): boolean;
  getTotalCount(): number;
  reset(): void;
}

// Performance tracking
withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  searchFunction: T
): (...args: Parameters<T>) => Promise<ReturnType<T>>
```
