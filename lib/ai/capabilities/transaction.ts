import { PublicKey } from '@solana/web3.js';
import { Message, ToolParams, ExecutionMode, CapabilityType } from '../types';
import { BaseCapability } from './base';

export class TransactionCapability extends BaseCapability {
  type: CapabilityType = 'transaction';
  executionMode = ExecutionMode.Sequential; // Transaction tools should run sequentially

  private readonly SIGNATURE_PATTERN = /[1-9A-HJ-NP-Za-km-z]{87,88}/;

  tools = [
    this.createToolExecutor(
      'fetchTransaction',
      'Fetches transaction details by signature',
      async ({ message }: ToolParams) => {
        const signature = this.extractSignature(message.content);
        if (!signature) throw new Error('No transaction signature found in message');
        
        return this.executeWithConnection(async (connection) => {
          return connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 0
          });
        });
      }
    ),
    this.createToolExecutor(
      'analyzeTransaction',
      'Analyzes transaction details for patterns and key information',
      async ({ context }: ToolParams) => {
        const tx = context.activeAnalysis?.data;
        if (!tx) throw new Error('No transaction data available');

        return {
          type: this.classifyTransaction(tx),
          tokenTransfers: this.extractTokenTransfers(tx),
          programInteractions: this.extractProgramInteractions(tx),
          fees: tx.meta?.fee,
          status: tx.meta?.err ? 'failed' : 'success'
        };
      }
    )
  ];

  canHandle(message: Message): boolean {
    return message.content.toLowerCase().includes('transaction') ||
           this.extractSignature(message.content) !== null;
  }

  private extractSignature(content: string): string | null {
    return this.extractFromContent(content, this.SIGNATURE_PATTERN);
  }

  private classifyTransaction(tx: any): string {
    // TODO: Implement transaction classification logic
    // e.g., token transfer, swap, NFT mint, etc.
    return 'unknown';
  }

  private extractTokenTransfers(tx: any): any[] {
    // TODO: Implement token transfer extraction logic
    return [];
  }

  private extractProgramInteractions(tx: any): string[] {
    return tx.transaction.message.accountKeys.map((key: PublicKey) => key.toString());
  }
} 