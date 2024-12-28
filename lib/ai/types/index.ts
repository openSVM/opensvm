export type MessageRole = 'system' | 'user' | 'assistant' | 'agent';

export type CapabilityType = 'transaction' | 'account' | 'network' | 'general';

export interface Message {
  role: MessageRole;
  content: string;
  metadata?: {
    type?: CapabilityType;
    data?: any;
  };
}

export interface Tool {
  name: string;
  description: string;
  execute: (params: ToolParams) => Promise<any>;
  matches?: (message: Message) => boolean;
  required?: boolean;
  dependencies?: string[];
}

export interface ToolParams {
  message: Message;
  context: AgentContext;
}

export interface AgentConfig {
  systemPrompt: string;
  capabilities: AgentCapability[];
  maxContextSize?: number;
  temperature?: number;
}

export interface AgentContext {
  messages: Message[];
  networkState?: NetworkState;
  activeAnalysis?: Analysis;
}

export interface NetworkState {
  currentSlot?: number;
  tps?: number;
  blockTime?: number;
  validatorCount?: number;
}

export interface Analysis {
  type: CapabilityType;
  status: 'pending' | 'complete' | 'error';
  data: any;
}

export interface AgentCapability {
  type: CapabilityType;
  tools: Tool[];
  executionMode?: ExecutionMode;
  canHandle: (message: Message) => boolean;
}

export interface Note {
  id: string;
  content: string;
  author: 'user' | 'assistant' | 'agent';
  timestamp: number;
}

export interface AgentAction {
  id: string;
  type: 
    | 'fetch_transaction'
    | 'fetch_account' 
    | 'fetch_token'
    | 'analyze_wallet'
    | 'track_program'
    | 'rank_wallets'
    | 'pumpfun_listen'
    | 'pumpfun_buy'
    | 'pumpfun_sell'
    | 'pumpfun_track';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  description: string;
  error?: string;
}

export enum ExecutionMode {
  Sequential = 'sequential',
  Parallel = 'parallel'
} 