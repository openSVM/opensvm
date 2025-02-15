import { AgentCapability, Tool, CapabilityType } from '../types';
import { TokenEstimator } from '../utils/token-estimator';

export class TokenEstimationCapability implements AgentCapability {
  type: CapabilityType = 'general';

  tools: Tool[] = [
    {
      name: 'estimate_token_usage',
      description: 'Estimate token usage and cost for AI models',
      execute: async (params: { message: { content: string } }) => {
        return TokenEstimator.estimateTokens(params.message.content);
      }
    }
  ];

  /**
   * Determines if this capability can handle the given message
   * @param message Message to check
   * @returns Boolean indicating if the capability can handle the message
   */
  canHandle(message: { content: string }): boolean {
    // Handle messages that explicitly ask about token estimation or contain keywords
    return /token(s)?(\s+)?(estimate|count|usage|spending)/i.test(message.content);
  }
}
