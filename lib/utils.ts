import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat().format(num)
}

// Detect input type for search
export function detectSearchInputType(input: string): {
  type: 'account' | 'transaction' | 'block' | 'token' | 'search';
  value: string;
} {
  // Clean the input
  const cleanInput = input.trim();

  // Transaction signature pattern (base58, 88 characters)
  if (/^[1-9A-HJ-NP-Za-km-z]{88}$/.test(cleanInput)) {
    return { type: 'transaction', value: cleanInput };
  }

  // Block number pattern (numeric)
  if (/^\d+$/.test(cleanInput)) {
    return { type: 'block', value: cleanInput };
  }

  // Account/Token address pattern (base58, 32-44 characters)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cleanInput)) {
    // For now, we'll treat all base58 addresses as account addresses
    // In a real implementation, you might want to check if it's a token mint
    // by querying the token program
    return { type: 'account', value: cleanInput };
  }

  // Default to search
  return { type: 'search', value: cleanInput };
}

// Get route for search input
export function getSearchRoute(input: string): string {
  const { type, value } = detectSearchInputType(input);
  
  switch (type) {
    case 'account':
      return `/account/${value}`;
    case 'transaction':
      return `/tx/${value}`;
    case 'block':
      return `/block/${value}`;
    case 'token':
      return `/token/${value}`;
    default:
      return `/search?q=${encodeURIComponent(value)}`;
  }
} 