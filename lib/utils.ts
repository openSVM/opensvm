import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PublicKey } from '@solana/web3.js';
import { getConnection } from './solana-connection';

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

// Validate Solana transaction signature format
export function isValidTransactionSignature(signature: string): boolean {
  if (!signature) return false;
  
  // Transaction signatures are 88 characters long and base58 encoded
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{88}$/;
  const isValid = base58Regex.test(signature);
  console.log('Validating transaction signature:', signature, 'Result:', isValid);
  return isValid;
}

// Check if address is a token by verifying account info
export async function isTokenMint(address: string): Promise<boolean> {
  if (!isValidSolanaAddress(address)) {
    console.log('Invalid Solana address format:', address);
    return false;
  }

  try {
    console.log('Checking if address is token mint:', address);
    const connection = await getConnection();
    const pubkey = new PublicKey(address);
    
    // Get account info
    const accountInfo = await connection.getAccountInfo(pubkey);
    if (!accountInfo) {
      console.log('Account not found:', address);
      return false;
    }

    // Check if account is owned by Token Program
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const isToken = accountInfo.owner.equals(TOKEN_PROGRAM_ID);
    
    if (isToken) {
      console.log('Found token mint:', address);
    } else {
      console.log('Not a token mint:', address);
    }
    
    return isToken;
  } catch (error) {
    console.error('Error checking token mint:', error);
    return false;
  }
}

// Generate search route based on query type
export async function getSearchRoute(query: string): Promise<string> {
  const trimmedQuery = query.trim();
  
  // Check if query is a block number
  if (/^\d+$/.test(trimmedQuery)) {
    return `/block/${trimmedQuery}`;
  }
  
  // Check if query is a transaction signature (88 chars)
  if (isValidTransactionSignature(trimmedQuery)) {
    return `/tx/${trimmedQuery}`;
  }
  
  // Check if query is a valid Solana address
  if (isValidSolanaAddress(trimmedQuery)) {
    try {
      // Check account type using API
      const response = await fetch(`${window.location.origin}/api/check-account-type?address=${encodeURIComponent(trimmedQuery)}`);
      const data = await response.json();
      
      switch (data.type) {
        case 'token':
          return `/token/${trimmedQuery}`;
        case 'program':
          return `/program/${trimmedQuery}`;
        case 'account':
        default:
          return `/account/${trimmedQuery}`;
      }
    } catch (error) {
      console.error('Error checking account type:', error);
      // On error, default to account page
      return `/account/${trimmedQuery}`;
    }
  }
  
  // If no specific match, use the search page
  return `/search?q=${encodeURIComponent(trimmedQuery)}`;
}
