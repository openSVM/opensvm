import { Connection, ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { SolanaParser, idl } from '@debridge-finance/solana-transaction-parser';
import { Idl } from '@coral-xyz/anchor';

export interface ParsedAccount {
  name?: string;
  isSigner: boolean;
  isWritable: boolean;
  pubkey: PublicKey;
  preBalance?: number;
  postBalance?: number;
}

export interface ParsedInstruction {
  name: string;
  programId: PublicKey;
  programName?: string;
  args: Record<string, any>;
  accounts: ParsedAccount[];
}


// Common program IDs for parsing
const COMMON_PROGRAM_IDS = {
  SYSTEM: '11111111111111111111111111111111',
  TOKEN: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  ASSOCIATED_TOKEN: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  COMPUTE_BUDGET: 'ComputeBudget111111111111111111111111111111',
  TOKEN_2022: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  TOKEN_METADATA: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
};

export async function parseTransaction(
  connection: Connection,
  signature: string
): Promise<{
  parsedInstructions: ParsedInstruction[];
  logs: string[];
}> {
  try {
    // Get transaction details
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed'
    });

    if (!tx) {
      throw new Error('Transaction not found');
    }

    // Create empty IDL for basic program parsing
    const emptyIdl = {
      version: "0.1.0",
      name: "basic",
      instructions: [],
      metadata: {
        name: "basic",
        version: "0.1.0",
        spec: "0.1.0",
        address: "11111111111111111111111111111111"
      },
      address: "11111111111111111111111111111111"
    };

    // Initialize parser with common program IDs for better parsing
    const parser = new SolanaParser([
      { programId: COMMON_PROGRAM_IDS.SYSTEM, idl: emptyIdl },
      { programId: COMMON_PROGRAM_IDS.TOKEN, idl: emptyIdl },
      { programId: COMMON_PROGRAM_IDS.ASSOCIATED_TOKEN, idl: emptyIdl },
      { programId: COMMON_PROGRAM_IDS.COMPUTE_BUDGET, idl: emptyIdl },
      { programId: COMMON_PROGRAM_IDS.TOKEN_2022, idl: emptyIdl },
      { programId: COMMON_PROGRAM_IDS.TOKEN_METADATA, idl: emptyIdl }
    ]);
    
    // Parse using solana-tx-parser with retry logic
    let retries = 3;
    let rawInstructions;
    while (retries > 0) {
      try {
        rawInstructions = await parser.parseTransactionByHash(connection, signature);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 100));
      }
    }
    
    // Transform instructions to match our interface
    const parsedInstructions = rawInstructions.map(ix => ({
      name: ix.name,
      programId: ix.programId,
      programName: getProgramName(ix.programId.toString()),
      args: ix.args || {},
      accounts: ix.accounts.map(acc => ({
        name: acc.name,
        isSigner: acc.isSigner,
        isWritable: acc.isWritable,
        pubkey: acc.pubkey,
        preBalance: undefined,
        postBalance: undefined
      }))
    }));
    
    return {
      parsedInstructions,
      logs: tx.meta?.logMessages || [],
    };
  } catch (error) {
    console.error('Error parsing transaction:', error);
    throw error;
  }
}

// Helper function to get human-readable program names
function getProgramName(programId: string): string {
  const KNOWN_PROGRAMS: Record<string, string> = {
    '11111111111111111111111111111111': 'System Program',
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'Token Program',
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token Program',
    'ComputeBudget111111111111111111111111111111': 'Compute Budget Program',
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb': 'Token-2022 Program',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s': 'Token Metadata Program',
    // Add more known programs as needed
  };

  return KNOWN_PROGRAMS[programId] || 'Unknown Program';
}
