/**
 * Estimates token count and potential cost for different AI models
 */
export class TokenEstimator {
  /**
   * Simple token estimation using character and word count approximation
   * @param prompt Input text to estimate tokens for
   * @returns Object with token details
   */
  static estimateTokens(prompt: string) {
    // Rough approximation methods
    const wordBasedTokens = this.estimateTokensByWords(prompt);
    const charBasedTokens = this.estimateTokensByCharacters(prompt);
    
    // Average the two methods for a more balanced estimate
    const estimatedTokens = Math.round((wordBasedTokens + charBasedTokens) / 2);
    
    // Rough estimates for different models
    const modelEstimates = {
      'gpt-3.5-turbo': {
        maxTokens: 4096,
        costPer1000Tokens: 0.0015,
      },
      'gpt-4': {
        maxTokens: 8192,
        costPer1000Tokens: 0.03,
      },
      'claude-2': {
        maxTokens: 100000,
        costPer1000Tokens: 0.008,
      }
    };

    return {
      tokenCount: estimatedTokens,
      details: Object.entries(modelEstimates).map(([model, details]) => ({
        model,
        tokenCount: estimatedTokens,
        estimatedCost: (estimatedTokens / 1000) * details.costPer1000Tokens,
        withinLimit: estimatedTokens <= details.maxTokens
      }))
    };
  }

  /**
   * Estimate tokens based on word count
   * Assumes roughly 0.75 tokens per word
   */
  private static estimateTokensByWords(prompt: string): number {
    const words = prompt.trim().split(/\s+/);
    return Math.ceil(words.length * 0.75);
  }

  /**
   * Estimate tokens based on character count
   * Assumes roughly 4 characters per token
   */
  private static estimateTokensByCharacters(prompt: string): number {
    return Math.ceil(prompt.length / 4);
  }
}
