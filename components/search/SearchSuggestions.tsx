'use client';

import React, { useState } from 'react';
import { SearchSuggestion } from './types';

interface SearchSuggestionsProps {
  showSuggestions: boolean;
  suggestions: SearchSuggestion[];
  suggestionsRef: React.RefObject<HTMLDivElement>;
  setQuery: (query: string) => void;
  setShowSuggestions: (show: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onSubmitValue?: (value: string) => void;
  isLoading?: boolean;
}

// Helper function to format currency values
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
};

// Helper function to format numbers
const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

// Helper function to format dates
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) {
    return date.toLocaleDateString();
  } else if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else {
    return 'Recently';
  }
};

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  showSuggestions,
  suggestions,
  suggestionsRef,
  setQuery,
  setShowSuggestions,
  handleSubmit,
  onSubmitValue,
  isLoading = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!showSuggestions) {
    return null;
  }

  const renderSuggestionMetadata = (suggestion: SearchSuggestion) => {
    const metadata = [];

    switch (suggestion.type) {
      case 'address':
        if (suggestion.balance !== undefined) {
          metadata.push(`${suggestion.balance.toFixed(4)} SOL`);
        }
        if (suggestion.actionCount !== undefined) {
          metadata.push(`${suggestion.actionCount} transactions`);
        }
        if (suggestion.lastUpdate) {
          metadata.push(formatDate(suggestion.lastUpdate));
        }
        break;

      case 'token':
        if (suggestion.price !== undefined) {
          metadata.push(formatCurrency(suggestion.price));
        }
        if (suggestion.volume !== undefined) {
          metadata.push(`Vol: ${formatCurrency(suggestion.volume)}`);
        }
        if (suggestion.lastUpdate) {
          metadata.push(formatDate(suggestion.lastUpdate));
        }
        break;

      case 'program':
        if (suggestion.usageCount !== undefined) {
          metadata.push(`${formatNumber(suggestion.usageCount)} calls`);
        }
        if (suggestion.lastUpdate) {
          metadata.push(`Updated ${formatDate(suggestion.lastUpdate)}`);
        }
        break;

      case 'transaction':
        if (suggestion.status) {
          metadata.push(suggestion.status === 'success' ? '✅ Success' : '❌ Failed');
        }
        if (suggestion.amount !== undefined && suggestion.amount > 0) {
          metadata.push(`${suggestion.amount.toFixed(4)} SOL`);
        }
        if (suggestion.lastUpdate) {
          metadata.push(formatDate(suggestion.lastUpdate));
        }
        break;
    }

    return metadata;
  };

  return (
    <div
      ref={suggestionsRef}
      className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto"
    >
      {isLoading ? (
        <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse delay-150"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse delay-300"></div>
          </div>
          <p className="mt-1 text-sm">Loading suggestions...</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
          No suggestions found
        </div>
      ) : (
        <>
          {suggestions.map((suggestion, index) => {
            const metadata = renderSuggestionMetadata(suggestion);
            const isHovered = hoveredIndex === index;

            return (
              <button
                key={`${suggestion.type}-${suggestion.value}`}
                type="button"
                onClick={() => {
                  setQuery(suggestion.value);
                  setShowSuggestions(false);
                  console.log("Suggestion selected:", suggestion.value);
                  
                  if (onSubmitValue) {
                    onSubmitValue(suggestion.value);
                  } else {
                    // Fallback: create a simple form submit event
                    setTimeout(() => {
                      const form = document.createElement('form');
                      const input = document.createElement('input');
                      input.value = suggestion.value;
                      form.appendChild(input);
                      
                      const event = new Event('submit', { bubbles: true, cancelable: true });
                      Object.defineProperty(event, 'target', { value: input, enumerable: true });
                      
                      handleSubmit(event as unknown as React.FormEvent);
                    }, 50);
                  }
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 relative border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
                  isHovered ? 'bg-gray-50 dark:bg-gray-800' : ''
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {isHovered && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        suggestion.type === 'address' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                        suggestion.type === 'token' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        suggestion.type === 'program' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
                        'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                      }`}>
                        {suggestion.type.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {suggestion.label || suggestion.value}
                    </div>
                    
                    {metadata.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {metadata.map((item, idx) => (
                          <span key={idx} className="text-xs text-gray-500 dark:text-gray-400">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center">
              <span>Press <kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs">↑</kbd> <kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs">↓</kbd> to navigate</span>
              <span>Press <kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs">Enter</kbd> to select</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
