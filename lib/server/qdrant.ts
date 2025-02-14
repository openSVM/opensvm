import { QdrantClient } from '@qdrant/js-client-rest';

export const COLLECTIONS = {
  TRANSACTIONS: 'transactions',
  ACCOUNTS: 'accounts',
  PROGRAMS: 'programs'
} as const;

export const VECTOR_SIZE = 1536;

const client = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333'
});

export async function storeGraph(transactions: any[]) {
  // Implementation
}

export async function findRelatedTransactions(signature: string) {
  // Implementation
}

export function buildTransactionGraph(transactions: any[]) {
  const nodes = new Map();
  const edges = new Map();
  const chunks = [];

  // Implementation

  return chunks;
}
