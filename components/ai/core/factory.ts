import { Connection } from '@solana/web3.js';
import { SolanaAgent } from './agent';
import { WalletCapability } from '../capabilities/wallet';
import type { AgentConfig } from '../types';

const DEFAULT_SYSTEM_PROMPT = `I am an AI assistant specialized in analyzing Solana blockchain data.
I can help you understand transactions, account activities, and network performance. 
I have access to real-time blockchain data and can provide detailed analysis.

Some things I can help with:
- Analyzing transactions and their effects
- Checking account balances and token holdings
- Monitoring network performance metrics (TPS, block time, etc.)
- Tracking validator status and performance
- Explaining complex blockchain operations in simple terms
- Estimating token usage for AI models
- Finding paths between wallets by tracking token transfers
- Trading tokens, launching new tokens, and other Solana operations

Please provide transaction signatures, account addresses, or ask about network metrics, 
and I'll help you understand what's happening on the Solana blockchain.`;

export interface AgentOptions {
  systemPrompt?: string;
  maxContextSize?: number;
  temperature?: number;
  enableWalletPathFinding?: boolean;
}

export function createSolanaAgent(
  connection: Connection, 
  options: AgentOptions = {}
): SolanaAgent {
  const capabilities = [];
  
  // Add wallet path finding capability
  if (options.enableWalletPathFinding !== false) {
    capabilities.push(new WalletCapability(connection));
  }
  
  const config: AgentConfig = {
    capabilities,
    systemPrompt: options.systemPrompt || DEFAULT_SYSTEM_PROMPT,
    maxContextSize: options.maxContextSize,
    temperature: options.temperature
  };

  return new SolanaAgent(config);
}
