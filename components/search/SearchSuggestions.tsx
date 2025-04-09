'use client';

import React from 'react';
import { SearchSuggestion } from './types';

interface SearchSuggestionsProps {
  showSuggestions: boolean;
  suggestions: SearchSuggestion[];
  suggestionsRef: React.RefObject<HTMLDivElement>;
  setQuery: (query: string) => void;
  setShowSuggestions: (show: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  showSuggestions,
  suggestions,
  suggestionsRef,
  setQuery,
  setShowSuggestions,
  handleSubmit,
}) => {
  if (!showSuggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div 
      ref={suggestionsRef} 
      className="absolute top-full left-0 right-0 mt-1 bg-background border border-input rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto
                animate-in fade-in-0 slide-in-from-top-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
      data-state={showSuggestions ? 'open' : 'closed'}
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          type="button"
          onClick={() => {
            setQuery(suggestion.value);
            setShowSuggestions(false);
            handleSubmit({ preventDefault: () => {} } as React.FormEvent);
          }}
          className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 transition-colors duration-200"
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <span className="text-xs text-muted-foreground uppercase">{suggestion.type}</span>
          <span className="flex-1 truncate text-foreground">{suggestion.label || suggestion.value}</span>
        </button>
      ))}
    </div>
  );
};
