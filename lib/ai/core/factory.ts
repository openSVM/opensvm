import { Connection } from '@solana/web3.js';
import { SolanaAgent } from './agent';
import { TransactionCapability } from '../capabilities/transaction';
import { AccountCapability } from '../capabilities/account';
import { NetworkCapability } from '../capabilities/network';
import { TokenEstimationCapability } from '../capabilities/token-estimation';
import type { AgentConfig } from '../types';

const DEFAULT_SYSTEM_PROMPT = `I am an AI assistant specialized in analyzing Solana blockchain data. 
I can help you understand transactions, account activities, and network performance. 
I have access to real-time blockchain data and can provide detailed analysis.

Some things I can help with:
- Analyzing transactions and their effects
- Checking account balances and activity
- Monitoring network performance metrics (TPS, block time, etc.)
- Tracking validator status and performance
- Explaining complex blockchain operations in simple terms
- Estimating token usage for AI models

For network performance queries:
- Use analyzeNetworkLoad to get current TPS and load metrics
- Use getNetworkStatus for general network health
- Use getValidatorInfo for validator statistics

Please provide transaction signatures, account addresses, or ask about network metrics, 
and I'll help you understand what's happening on the Solana blockchain.`;

export interface AgentOptions {
  systemPrompt?: string;
  maxContextSize?: number;
  temperature?: number;
}

export function createSolanaAgent(
  connection: Connection, 
  options: AgentOptions = {}
): SolanaAgent {
  const config: AgentConfig = {
    capabilities: [
      new TransactionCapability(connection),
      new AccountCapability(connection),
      new NetworkCapability(connection),
      new TokenEstimationCapability()
    ],
    systemPrompt: options.systemPrompt || DEFAULT_SYSTEM_PROMPT,
    maxContextSize: options.maxContextSize,
    temperature: options.temperature
  };

  return new SolanaAgent(config);
}
