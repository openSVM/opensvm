import { Connection } from '@solana/web3.js';
import { AgentCapability, CapabilityType, Message, Tool } from '../types';

export abstract class BaseCapability implements AgentCapability {
  abstract type: CapabilityType;
  abstract tools: Tool[];
  protected connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  abstract canHandle(message: Message): boolean;

  protected extractFromContent(content: string, pattern: RegExp): string | null {
    const match = content.match(pattern);
    return match ? match[0] : null;
  }

  protected async executeWithConnection<T>(
    operation: (connection: Connection) => Promise<T>
  ): Promise<T> {
    try {
      return await operation(this.connection);
    } catch (error) {
      console.error(`Error executing operation:`, error);
      throw error;
    }
  }

  protected createToolExecutor(
    name: string,
    description: string,
    executor: (params: any) => Promise<any>
  ): Tool {
    return {
      name,
      description,
      execute: executor
    };
  }
} 