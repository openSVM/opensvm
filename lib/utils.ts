import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Input sanitization for search queries
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  
  // Remove any potentially harmful characters
  const sanitized = query
    .trim()
    // Remove HTML/script tags
    .replace(/<[^>]*>/g, '')
    // Remove special characters except those valid in addresses
    .replace(/[^\w\s-_.]/g, '')
    // Limit length
    .slice(0, 100);
    
  return sanitized;
}

// Format number with commas and decimal places
export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

// Validate Solana address format
export function isValidSolanaAddress(address: string): boolean {
  // Basic validation for base58 format and length
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}
