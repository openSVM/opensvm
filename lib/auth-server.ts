/**
 * Server-side authentication utilities for cookie management
 */

import { cookies } from 'next/headers';
import { SessionData } from './auth';

/**
 * Set session cookie (server-side only)
 */
export function setSessionCookie(sessionData: SessionData) {
  const cookieStore = cookies();
  const sessionJson = JSON.stringify(sessionData);
  
  cookieStore.set('opensvm_session', sessionJson, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });
}

/**
 * Get session from cookie (server-side only)
 */
export function getSessionFromCookie(): SessionData | null {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('opensvm_session');
    
    if (!sessionCookie?.value) {
      return null;
    }
    
    const sessionData = JSON.parse(sessionCookie.value) as SessionData;
    
    // Check if session is expired
    if (Date.now() > sessionData.expiresAt) {
      return null;
    }
    
    return sessionData;
  } catch (error) {
    console.error('Error getting session from cookie:', error);
    return null;
  }
}

/**
 * Clear session cookie (server-side only)
 */
export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete('opensvm_session');
}

/**
 * Get authenticated session and validate it
 */
export function getAuthenticatedSession(): SessionData | null {
  return getSessionFromCookie();
}