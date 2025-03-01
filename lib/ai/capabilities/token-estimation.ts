import type { AgentCapability, Tool, CapabilityType, ToolParams } from '../types';
import { TokenEstimator } from '../utils/token-estimator';

export class TokenEstimationCapability implements AgentCapability {
  type: CapabilityType = 'general';

  tools: Tool[] = [
    {
      name: 'estimateTokens',
      description: 'Estimates the number of tokens that will be used by a prompt',
      execute: async (params: ToolParams) => {
        // Extract the prompt from the message content
        const prompt = params.message.content;
        return TokenEstimator.estimateTokens(prompt);
      }
    }
  ];

  canHandle(message: { content: string }): boolean {
    const content = message.content.toLowerCase();
    return content.includes('token') && 
           (content.includes('estimate') || content.includes('count'));
  }
}
