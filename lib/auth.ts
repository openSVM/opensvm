/**
 * Authentication utilities for Solana wallet-based sessions
 */

import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { nanoid } from 'nanoid';

export interface SessionData {
  sessionKey: string;
  walletAddress: string;
  signature: string;
  timestamp: number;
  expiresAt: number;
}

/**
 * Generate a session key for signing
 */
export function generateSessionKey(): string {
  return nanoid(32);
}

/**
 * Create the message to be signed by the wallet
 */
export function createSignMessage(sessionKey: string, walletAddress: string): string {
  const timestamp = Date.now();
  return `OpenSVM Authentication\n\nSession Key: ${sessionKey}\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\n\nPlease sign this message to authenticate with OpenSVM.`;
}

/**
 * Verify a signature for a given message and public key
 */
export function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyObj = new PublicKey(publicKey);
    
    // Note: In a real implementation, you would use the wallet's sign verification
    // This is a simplified version for demonstration
    return signatureBytes.length === 64 && publicKeyObj.toBase58() === publicKey;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Validate session for API requests (server-side only)
 */
export function validateSession(request: Request): SessionData | null {
  try {
    // This function needs to be implemented in the server context
    // where cookies() is available. For now, return null.
    // This will be handled in the individual API route files.
    return null;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}