import { Connection } from '@solana/web3.js';
import { BaseCapability } from './base';
import type { Message, ToolParams, CapabilityType } from '../types';
import { ExecutionMode } from '../types';

export class TokenEstimationCapability extends BaseCapability {
  type: CapabilityType = 'network';
  executionMode = ExecutionMode.Sequential;

  constructor() {
    // We're using a nullish connection here since this capability
    // doesn't actually need to interact with the blockchain
    super(null as unknown as Connection);
  }

  tools = [
    this.createToolExecutor(
      'estimateTokenUsage',
      'Estimates token usage for AI models',
      async ({ message }: ToolParams) => {
        // Simple placeholder implementation
        const textLength = message.content.length;
        const tokens = Math.ceil(textLength / 4); // Very rough approximation
        
        return `Estimated token usage: ${tokens} tokens`;
      }
    ),
  ];

  canHandle(message: Message): boolean {
    return message.content.toLowerCase().includes('token usage') ||
           message.content.toLowerCase().includes('estimate tokens');
  }
}
