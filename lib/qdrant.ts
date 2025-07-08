/**
 * Qdrant Database utilities for user history storage
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { UserHistoryEntry, UserProfile } from '@/types/user-history';

// Initialize Qdrant client
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_SERVER || 'http://localhost:6333',
  apiKey: process.env.QDRANT || undefined,
});

// Collection names
export const COLLECTIONS = {
  USER_HISTORY: 'user_history',
  USER_PROFILES: 'user_profiles',
  USER_FOLLOWS: 'user_follows',
  USER_LIKES: 'user_likes'
} as const;

// Export qdrant client for direct access
export { qdrantClient };

/**
 * Initialize Qdrant collections for user data
 */
export async function initializeCollections() {
  try {
    // Check if user_history collection exists
    const historyExists = await qdrantClient.getCollection(COLLECTIONS.USER_HISTORY).catch(() => null);
    
    if (!historyExists) {
      await qdrantClient.createCollection(COLLECTIONS.USER_HISTORY, {
        vectors: {
          size: 384, // Dimension for text embeddings
          distance: 'Cosine'
        }
      });
      
      // Note: Field indexing is handled automatically by Qdrant for filtering
    }
    
    // Check if user_profiles collection exists
    const profilesExists = await qdrantClient.getCollection(COLLECTIONS.USER_PROFILES).catch(() => null);
    
    if (!profilesExists) {
      await qdrantClient.createCollection(COLLECTIONS.USER_PROFILES, {
        vectors: {
          size: 384,
          distance: 'Cosine'
        }
      });
      
      // Note: Field indexing is handled automatically by Qdrant for filtering
    }
    
    // Check if user_follows collection exists
    const followsExists = await qdrantClient.getCollection(COLLECTIONS.USER_FOLLOWS).catch(() => null);
    
    if (!followsExists) {
      await qdrantClient.createCollection(COLLECTIONS.USER_FOLLOWS, {
        vectors: {
          size: 384,
          distance: 'Cosine'
        }
      });
    }
    
    // Check if user_likes collection exists
    const likesExists = await qdrantClient.getCollection(COLLECTIONS.USER_LIKES).catch(() => null);
    
    if (!likesExists) {
      await qdrantClient.createCollection(COLLECTIONS.USER_LIKES, {
        vectors: {
          size: 384,
          distance: 'Cosine'
        }
      });
    }
    
    console.log('Qdrant collections initialized successfully');
  } catch (error) {
    console.error('Error initializing Qdrant collections:', error);
    throw error;
  }
}

/**
 * Generate a simple embedding for text content
 * In a real implementation, you'd use a proper embedding model
 */
function generateSimpleEmbedding(text: string): number[] {
  // Simple hash-based embedding for demonstration
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Generate 384-dimensional vector
  const vector = new Array(384).fill(0);
  for (let i = 0; i < 384; i++) {
    vector[i] = Math.sin(hash + i) * 0.1;
  }
  
  return vector;
}

/**
 * Store user history entry in Qdrant
 */
export async function storeHistoryEntry(entry: UserHistoryEntry): Promise<void> {
  try {
    await initializeCollections();
    
    // Generate embedding from page content
    const textContent = `${entry.pageTitle} ${entry.path} ${entry.pageType} ${JSON.stringify(entry.metadata)}`;
    const vector = generateSimpleEmbedding(textContent);
    
    await qdrantClient.upsert(COLLECTIONS.USER_HISTORY, {
      wait: true,
      points: [{
        id: entry.id,
        vector,
        payload: {
          ...entry,
          // Ensure timestamp is stored as integer for indexing
          timestamp: entry.timestamp
        }
      }]
    });
  } catch (error) {
    console.error('Error storing history entry:', error);
    throw error;
  }
}

/**
 * Get user history from Qdrant
 */
export async function getUserHistory(
  walletAddress: string,
  options: {
    limit?: number;
    offset?: number;
    pageType?: string;
  } = {}
): Promise<{ history: UserHistoryEntry[]; total: number }> {
  try {
    await initializeCollections();
    
    const { limit = 100, offset = 0, pageType } = options;
    
    // Build filter
    const filter: any = {
      must: [
        {
          key: 'walletAddress',
          match: { value: walletAddress }
        }
      ]
    };
    
    if (pageType) {
      filter.must.push({
        key: 'pageType',
        match: { value: pageType }
      });
    }
    
    // Search with filter
    const result = await qdrantClient.search(COLLECTIONS.USER_HISTORY, {
      vector: new Array(384).fill(0), // Dummy vector for filtered search
      filter,
      limit,
      offset,
      with_payload: true
    });
    
    // Get total count
    const countResult = await qdrantClient.count(COLLECTIONS.USER_HISTORY, {
      filter
    });
    
    const history = result.map(point => point.payload as unknown as UserHistoryEntry);
    
    // Sort by timestamp (newest first)
    history.sort((a, b) => b.timestamp - a.timestamp);
    
    return {
      history,
      total: countResult.count
    };
  } catch (error) {
    console.error('Error getting user history:', error);
    throw error;
  }
}

/**
 * Delete user history from Qdrant
 */
export async function deleteUserHistory(walletAddress: string): Promise<void> {
  try {
    await initializeCollections();
    
    await qdrantClient.delete(COLLECTIONS.USER_HISTORY, {
      wait: true,
      filter: {
        must: [{
          key: 'walletAddress',
          match: { value: walletAddress }
        }]
      }
    });
  } catch (error) {
    console.error('Error deleting user history:', error);
    throw error;
  }
}

/**
 * Store user profile in Qdrant
 */
export async function storeUserProfile(profile: UserProfile): Promise<void> {
  try {
    await initializeCollections();
    
    // Generate embedding from profile data
    const textContent = `${profile.walletAddress} ${profile.displayName || ''} ${profile.bio || ''}`;
    const vector = generateSimpleEmbedding(textContent);
    
    await qdrantClient.upsert(COLLECTIONS.USER_PROFILES, {
      wait: true,
      points: [{
        id: profile.walletAddress,
        vector,
        payload: profile as any
      }]
    });
  } catch (error) {
    console.error('Error storing user profile:', error);
    throw error;
  }
}

/**
 * Get user profile from Qdrant
 */
export async function getUserProfile(walletAddress: string): Promise<UserProfile | null> {
  try {
    await initializeCollections();
    
    const result = await qdrantClient.retrieve(COLLECTIONS.USER_PROFILES, {
      ids: [walletAddress],
      with_payload: true
    });
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0].payload as unknown as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Check Qdrant connection health
 */
export async function checkQdrantHealth(): Promise<boolean> {
  try {
    await qdrantClient.getCollections();
    return true;
  } catch (error) {
    console.error('Qdrant health check failed:', error);
    return false;
  }
}

/**
 * Social Features - Follow functionality
 */

// User follow entry interface
interface UserFollowEntry {
  id: string;
  followerAddress: string;
  targetAddress: string;
  timestamp: number;
}

/**
 * Store user follow relationship
 */
export async function storeUserFollow(entry: UserFollowEntry): Promise<void> {
  try {
    await initializeCollections();
    
    const textContent = `${entry.followerAddress} follows ${entry.targetAddress}`;
    const vector = generateSimpleEmbedding(textContent);
    
    await qdrantClient.upsert(COLLECTIONS.USER_FOLLOWS, {
      wait: true,
      points: [{
        id: entry.id,
        vector,
        payload: entry as any
      }]
    });
  } catch (error) {
    console.error('Error storing user follow:', error);
    throw error;
  }
}

/**
 * Remove user follow relationship
 */
export async function removeUserFollow(followerAddress: string, targetAddress: string): Promise<void> {
  try {
    await initializeCollections();
    
    await qdrantClient.delete(COLLECTIONS.USER_FOLLOWS, {
      wait: true,
      filter: {
        must: [
          { key: 'followerAddress', match: { value: followerAddress } },
          { key: 'targetAddress', match: { value: targetAddress } }
        ]
      }
    });
  } catch (error) {
    console.error('Error removing user follow:', error);
    throw error;
  }
}

/**
 * Get user followers
 */
export async function getUserFollowers(targetAddress: string): Promise<UserFollowEntry[]> {
  try {
    await initializeCollections();
    
    const result = await qdrantClient.search(COLLECTIONS.USER_FOLLOWS, {
      vector: new Array(384).fill(0),
      filter: {
        must: [{ key: 'targetAddress', match: { value: targetAddress } }]
      },
      limit: 1000,
      with_payload: true
    });
    
    return result.map(point => point.payload as unknown as UserFollowEntry);
  } catch (error) {
    console.error('Error getting user followers:', error);
    return [];
  }
}

/**
 * Get users that a user is following
 */
export async function getUserFollowing(followerAddress: string): Promise<UserFollowEntry[]> {
  try {
    await initializeCollections();
    
    const result = await qdrantClient.search(COLLECTIONS.USER_FOLLOWS, {
      vector: new Array(384).fill(0),
      filter: {
        must: [{ key: 'followerAddress', match: { value: followerAddress } }]
      },
      limit: 1000,
      with_payload: true
    });
    
    return result.map(point => point.payload as unknown as UserFollowEntry);
  } catch (error) {
    console.error('Error getting user following:', error);
    return [];
  }
}

/**
 * Social Features - Like functionality
 */

// User like entry interface
interface UserLikeEntry {
  id: string;
  likerAddress: string;
  targetAddress: string;
  timestamp: number;
}

/**
 * Store user like relationship
 */
export async function storeUserLike(entry: UserLikeEntry): Promise<void> {
  try {
    await initializeCollections();
    
    const textContent = `${entry.likerAddress} likes ${entry.targetAddress}`;
    const vector = generateSimpleEmbedding(textContent);
    
    await qdrantClient.upsert(COLLECTIONS.USER_LIKES, {
      wait: true,
      points: [{
        id: entry.id,
        vector,
        payload: entry as any
      }]
    });
  } catch (error) {
    console.error('Error storing user like:', error);
    throw error;
  }
}

/**
 * Remove user like relationship
 */
export async function removeUserLike(likerAddress: string, targetAddress: string): Promise<void> {
  try {
    await initializeCollections();
    
    await qdrantClient.delete(COLLECTIONS.USER_LIKES, {
      wait: true,
      filter: {
        must: [
          { key: 'likerAddress', match: { value: likerAddress } },
          { key: 'targetAddress', match: { value: targetAddress } }
        ]
      }
    });
  } catch (error) {
    console.error('Error removing user like:', error);
    throw error;
  }
}

/**
 * Get user likes
 */
export async function getUserLikes(targetAddress: string): Promise<UserLikeEntry[]> {
  try {
    await initializeCollections();
    
    const result = await qdrantClient.search(COLLECTIONS.USER_LIKES, {
      vector: new Array(384).fill(0),
      filter: {
        must: [{ key: 'targetAddress', match: { value: targetAddress } }]
      },
      limit: 1000,
      with_payload: true
    });
    
    return result.map(point => point.payload as unknown as UserLikeEntry);
  } catch (error) {
    console.error('Error getting user likes:', error);
    return [];
  }
}