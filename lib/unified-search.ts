/**
 * Unified Search Interface
 * 
 * This module integrates all search sources (SVM, Moralis, Telegram, DuckDuckGo, X.com)
 * into a unified search interface with consistent result formatting and display.
 */

import { enrichSearchResultsWithMoralisData } from './moralis-api';
import { searchTelegramChats, formatTelegramResults } from './telegram-search';
import { searchDuckDuckGo, formatDuckDuckGoResults } from './duckduckgo-search';
import { searchXCom, formatXComResults } from './xcom-search';

// Search source types
export type SearchSource = 'svm' | 'telegram' | 'duckduckgo' | 'xcom' | 'all';

// Unified search result interface
export interface UnifiedSearchResult {
  id: string;
  type: string;
  title: string;
  content: string;
  url?: string;
  timestamp?: string;
  metadata?: any;
}

// Search options interface
export interface SearchOptions {
  sources?: SearchSource[];
  limit?: number;
  sortBy?: 'relevance' | 'date';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Perform a unified search across all specified sources
 * @param query - Search query
 * @param options - Search options
 * @returns Promise with search results from all sources
 */
export async function unifiedSearch(query: string, options: SearchOptions = {}) {
  const {
    sources = ['all'],
    limit = 10,
    sortBy = 'relevance',
    sortOrder = 'desc'
  } = options;
  
  // Determine which sources to search
  const searchSVM = sources.includes('all') || sources.includes('svm');
  const searchTelegram = sources.includes('all') || sources.includes('telegram');
  const searchDuckDuckGo = sources.includes('all') || sources.includes('duckduckgo');
  const searchX = sources.includes('all') || sources.includes('xcom');
  
  try {
    // Initialize results object
    const results: {
      svm: UnifiedSearchResult[];
      telegram: UnifiedSearchResult[];
      duckduckgo: UnifiedSearchResult[];
      xcom: UnifiedSearchResult[];
    } = {
      svm: [],
      telegram: [],
      duckduckgo: [],
      xcom: []
    };
    
    // Perform searches in parallel
    const searchPromises: Promise<any>[] = [];
    
    // SVM search (using existing API)
    if (searchSVM) {
      const svmSearchPromise = fetch(`/api/search/filtered?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(async data => {
          // Enrich SVM results with Moralis data
          const enrichedData = await enrichSearchResultsWithMoralisData(query, data);
          
          // Format SVM results
          results.svm = enrichedData.map((result: any) => ({
            id: result.address || `svm_${Math.random().toString(36).substring(2, 15)}`,
            type: 'svm',
            title: result.type ? `${result.type.charAt(0).toUpperCase() + result.type.slice(1)}` : 'Solana Address',
            content: result.address,
            timestamp: result.timestamp,
            metadata: {
              ...result,
              moralisData: result.moralisData
            }
          }));
        })
        .catch(error => {
          console.error('Error in SVM search:', error);
          results.svm = [];
        });
      
      searchPromises.push(svmSearchPromise);
    }
    
    // Telegram search
    if (searchTelegram) {
      const telegramSearchPromise = searchTelegramChats(query, limit)
        .then(data => {
          results.telegram = formatTelegramResults(data);
        })
        .catch(error => {
          console.error('Error in Telegram search:', error);
          results.telegram = [];
        });
      
      searchPromises.push(telegramSearchPromise);
    }
    
    // DuckDuckGo search
    if (searchDuckDuckGo) {
      const duckDuckGoSearchPromise = searchDuckDuckGo(query, limit)
        .then(data => {
          results.duckduckgo = formatDuckDuckGoResults(data);
        })
        .catch(error => {
          console.error('Error in DuckDuckGo search:', error);
          results.duckduckgo = [];
        });
      
      searchPromises.push(duckDuckGoSearchPromise);
    }
    
    // X.com search
    if (searchX) {
      const xSearchPromise = searchXCom(query, limit)
        .then(data => {
          results.xcom = formatXComResults(data);
        })
        .catch(error => {
          console.error('Error in X.com search:', error);
          results.xcom = [];
        });
      
      searchPromises.push(xSearchPromise);
    }
    
    // Wait for all searches to complete
    await Promise.all(searchPromises);
    
    // Combine and sort results
    let allResults: UnifiedSearchResult[] = [
      ...results.svm,
      ...results.telegram,
      ...results.duckduckgo,
      ...results.xcom
    ];
    
    // Sort results
    allResults = sortResults(allResults, sortBy, sortOrder);
    
    return {
      query,
      sources: {
        svm: results.svm,
        telegram: results.telegram,
        duckduckgo: results.duckduckgo,
        xcom: results.xcom
      },
      combined: allResults
    };
  } catch (error) {
    console.error('Error in unified search:', error);
    throw error;
  }
}

/**
 * Sort search results based on specified criteria
 * @param results - Search results to sort
 * @param sortBy - Field to sort by
 * @param sortOrder - Sort order (asc or desc)
 * @returns Sorted results
 */
function sortResults(
  results: UnifiedSearchResult[],
  sortBy: 'relevance' | 'date',
  sortOrder: 'asc' | 'desc'
): UnifiedSearchResult[] {
  if (sortBy === 'date' && results.some(r => r.timestamp)) {
    return results.sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }
  
  // For relevance sorting, we would typically use a scoring algorithm
  // For this implementation, we'll use a simple approach based on result type
  const typeWeights: Record<string, number> = {
    svm: 10,      // Prioritize SVM results
    telegram: 7,  // Then social media
    xcom: 6,
    web: 5        // Then web results
  };
  
  return results.sort((a, b) => {
    const weightA = typeWeights[a.type] || 0;
    const weightB = typeWeights[b.type] || 0;
    
    return sortOrder === 'asc' ? weightA - weightB : weightB - weightA;
  });
}

/**
 * Get appropriate icon for result type
 * @param type - Result type
 * @returns Icon JSX
 */
export function getResultTypeIcon(type: string): string {
  switch (type) {
    case 'svm':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>`;
    case 'telegram':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 12a9.5 9.5 0 1 1-9.5-9.5 9.46 9.46 0 0 1 9.5 9.5v0Z"></path><path d="m7 15 3-3a4.24 4.24 0 0 1 6 0l1 1"></path><path d="m17 13-5 5.5a4.24 4.24 0 0 1-6 0l-1-1"></path></svg>`;
    case 'web':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
    case 'x_com':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
  }
}

/**
 * Render a unified search result
 * @param result - Search result to render
 * @returns HTML string for the result card
 */
export function renderUnifiedSearchResult(result: UnifiedSearchResult): string {
  const icon = getResultTypeIcon(result.type);
  const date = result.timestamp ? new Date(result.timestamp) : null;
  const formattedDate = date ? `${date.toLocaleDateString()} ${date.toLocaleTimeString()}` : '';
  
  let bgColor = 'bg-primary/10';
  let textColor = 'text-primary';
  
  switch (result.type) {
    case 'svm':
      bgColor = 'bg-purple-100 dark:bg-purple-900/20';
      textColor = 'text-purple-500 dark:text-purple-300';
      break;
    case 'telegram':
      bgColor = 'bg-blue-100 dark:bg-blue-900/20';
      textColor = 'text-blue-500 dark:text-blue-300';
      break;
    case 'web':
      bgColor = 'bg-green-100 dark:bg-green-900/20';
      textColor = 'text-green-500 dark:text-green-300';
      break;
    case 'x_com':
      bgColor = 'bg-gray-100 dark:bg-gray-800';
      textColor = 'text-gray-700 dark:text-gray-300';
      break;
  }
  
  return `
    <div class="border rounded-lg p-4 hover:bg-muted/30 transition-colors duration-200 animate-in fade-in-0" style="animation-delay: ${Math.random() * 300}ms">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 w-10 h-10 ${bgColor} rounded-full flex items-center justify-center ${textColor}">
          ${icon}
        </div>
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <h3 class="font-medium text-sm">${result.title}</h3>
            ${date ? `<span class="text-xs text-muted-foreground">${formattedDate}</span>` : ''}
          </div>
          <p class="mt-1 text-sm">${result.content}</p>
          ${result.url ? `
            <div class="mt-2">
              <a href="${result.url}" target="_blank" rel="noopener noreferrer" class="text-xs text-primary hover:underline">
                View source
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}
