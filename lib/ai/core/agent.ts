import { 
  AgentConfig, 
  AgentContext, 
  Message, 
  Tool, 
  ToolParams,
  CapabilityType,
  AgentAction,
  AgentCapability
} from '../types';

export class SolanaAgent {
  private config: AgentConfig;
  private context: AgentContext;

  constructor(config: AgentConfig) {
    this.config = config;
    this.context = {
      messages: [{
        role: 'system',
        content: config.systemPrompt
      }]
    };
  }

  private extractActionsFromResponse(response: string): AgentAction[] {
    const actionMatches = response.match(/\[ACTION\](.*?)\[\/ACTION\]/g) || [];
    return actionMatches.map(match => {
      const actionContent = match.replace('[ACTION]', '').replace('[/ACTION]', '').trim();
      const firstColonIndex = actionContent.indexOf(':');
      if (firstColonIndex === -1) {
        throw new Error('Invalid action format: missing type delimiter');
      }
      const type = actionContent.slice(0, firstColonIndex).trim();
      const description = actionContent.slice(firstColonIndex + 1).trim();
      return {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: type as AgentAction['type'],
        status: 'pending' as const,
        description
      };
    });
  }

  async processMessage(message: Message): Promise<Message> {
    // Add message to context
    this.context.messages.push(message);

    // If this is a planning request (system message), generate action plan
    if (message.role === 'system') {
      const planningResponse = {
        role: 'assistant' as const,
        content: await this.generateActionPlan(message.content),
        metadata: {
          type: 'planning' as CapabilityType,
          data: null
        }
      };
      this.context.messages.push(planningResponse);
      return planningResponse;
    }

    // For user messages, determine capability and execute
    const capability = this.config.capabilities.find(cap => cap.canHandle(message));
    
    if (!capability) {
      return this.createErrorResponse('I apologize, but I\'m not sure how to handle that request.');
    }

    try {
      // Get the last assistant message which should contain the action plan
      const lastAssistantMessage = [...this.context.messages]
        .reverse()
        .find(m => m.role === 'assistant');
      
      // Extract actions from the last assistant message if it exists
      const actions = lastAssistantMessage 
        ? this.extractActionsFromResponse(lastAssistantMessage.content)
        : [];
      
      // Execute actions if present, otherwise use capability directly
      const result = actions.length > 0 
        ? await this.executeActions(actions)
        : await this.executeCapability(capability, message);
      
      // Generate response using result
      const response = this.createResponse(capability.type, result);

      // Add response to context
      this.context.messages.push(response);
      
      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return this.createErrorResponse('I encountered an error while processing your request.');
    }
  }

  private async generateActionPlan(prompt: string): Promise<string> {
    // TODO: In a real implementation, this would use an LLM to generate the action plan
    // For now, we'll use a simple implementation that extracts RPC method names
    // and creates corresponding actions
    const methods = prompt.match(/available methods: (.*?)(?:\.|$)/i)?.[1] || '';
    const actionsList = methods.split(', ')
      .filter(Boolean)
      .map(method => `[ACTION]${method}:Execute ${method}[/ACTION]`)
      .join('\n');
    
    return actionsList || 'No actions needed';
  }

  private async executeActions(actions: AgentAction[]): Promise<any[]> {
    const results = [];
    for (const action of actions) {
      try {
        // Parse action type to extract capability
        const capabilityInfo = this.parseActionType(action.type);
        if (!capabilityInfo) {
          throw new Error(`Invalid action type: ${action.type}`);
        }

        const { capabilityType } = capabilityInfo;

        // Find matching capability
        const capability = this.config.capabilities.find(cap => 
          this.matchesCapability(cap.type, capabilityType)
        );

        if (!capability) {
          throw new Error(`No capability found for type: ${capabilityType}`);
        }

        const result = await this.executeCapability(capability, {
          role: 'user',
          content: action.description
        });

        results.push({ 
          action, 
          result, 
          status: 'completed' as const,
          capabilityType: capability.type 
        });
      } catch (error) {
        results.push({ 
          action, 
          error: error.message, 
          status: 'failed' as const
        });
      }
    }
    return results;
  }

  private parseActionType(actionType: string): { capabilityType: string } | null {
    // Handle various action type formats:
    // 1. simple_action
    // 2. capability.action
    // 3. capability/action
    // 4. capabilityAction
    
    const formats = [
      // Format: simple_action or capability_action
      /^(?:([a-z]+)_)?([a-z]+)$/i,
      // Format: capability.action
      /^([a-z]+)\.([a-z]+)$/i,
      // Format: capability/action
      /^([a-z]+)\/([a-z]+)$/i,
      // Format: camelCase (e.g., transactionFetch)
      /^([a-z]+)([A-Z][a-z]+)$/
    ];

    for (const format of formats) {
      const match = actionType.match(format);
      if (match) {
        // The capability type is either the first capture group or the second,
        // depending on the format
        const capabilityType = match[1] || match[2];
        return { capabilityType: capabilityType.toLowerCase() };
      }
    }

    return null;
  }

  private matchesCapability(capabilityType: string, actionCapabilityType: string): boolean {
    // Normalize both types for comparison
    const normalizedCapability = capabilityType.toLowerCase();
    const normalizedAction = actionCapabilityType.toLowerCase();

    // Direct match
    if (normalizedCapability === normalizedAction) {
      return true;
    }

    // Handle plural forms (e.g., "transaction" matches "transactions")
    if (normalizedCapability.replace(/s$/, '') === normalizedAction.replace(/s$/, '')) {
      return true;
    }

    // Add more matching rules as needed

    return false;
  }

  private async executeCapability(capability: AgentCapability, message: Message): Promise<any> {
    // Get all tools for this capability
    const tools = capability.tools;
    const results = [];

    // Filter tools based on relevance to the message
    const relevantTools = tools.filter(tool => {
      // Check if tool matches message intent or keywords
      const toolMatches = tool.matches?.(message) ?? false;
      // Check if tool is required by capability
      const isRequired = tool.required ?? false;
      return toolMatches || isRequired;
    });

    if (relevantTools.length === 0) {
      return [];
    }

    // Create a map of completed tools
    const completedTools = new Set<string>();

    // Keep track of tools left to execute
    let remainingTools = [...relevantTools];

    // Execute tools respecting dependencies
    while (remainingTools.length > 0) {
      // Find tools that can be executed (all dependencies satisfied)
      const executableTools = remainingTools.filter(tool => {
        const dependencies = (tool.dependencies || []) as string[];
        return dependencies.every(dep => completedTools.has(dep));
      });

      if (executableTools.length === 0 && remainingTools.length > 0) {
        throw new Error('Circular dependency detected in tools');
      }

      // Execute the current batch of tools
      const batchResults = await Promise.all(
        executableTools.map(async tool => {
          const result = await this.executeTool(tool, message);
          return {
            ...result,
            status: 'completed' as const
          };
        })
      );

      // Add results and mark tools as completed
      results.push(...batchResults);
      executableTools.forEach(tool => completedTools.add(tool.name));

      // Remove executed tools from remaining
      remainingTools = remainingTools.filter(tool => 
        !executableTools.includes(tool)
      );
    }

    return results;
  }

  private async executeTool(tool: Tool, message: Message): Promise<any> {
    const params: ToolParams = {
      message,
      context: this.context
    };

    try {
      const result = await tool.execute(params);
      return {
        tool: tool.name,
        result
      };
    } catch (error) {
      console.error(`Error executing tool ${tool.name}:`, error);
      throw error;
    }
  }

  private createResponse(type: CapabilityType, data: any): Message {
    return {
      role: 'assistant',
      content: this.generateResponse(data),
      metadata: {
        type,
        data
      }
    };
  }

  private createErrorResponse(content: string): Message {
    return {
      role: 'assistant',
      content,
      metadata: {
        type: 'general' as CapabilityType,
        data: null
      }
    };
  }

  private generateResponse(result: any): string {
    if (!result) {
      return "I wasn't able to get any results for your request.";
    }

    // Generate LLM overview based on result type and content
    const generateOverview = (data: any): string => {
      // Analyze the data structure and content
      const dataType = Array.isArray(data) ? 'array' : typeof data;
      const hasError = data.error || (Array.isArray(data) && data.some(item => item.status === 'failed'));
      
      // Generate appropriate overview based on data characteristics
      if (hasError) {
        return "⚠️ There were some issues processing your request. Here are the details:";
      }
      
      if (dataType === 'array') {
        const successCount = data.filter(item => item.status === 'completed').length;
        return `✅ Successfully completed ${successCount} operation${successCount !== 1 ? 's' : ''}. Here's what I found:`;
      }
      
      if (dataType === 'object') {
        const keys = Object.keys(data).filter(key => !['id', '_id', 'type', 'status'].includes(key));
        if (data.message) {
          return `📝 ${data.message}`;
        }
        return `📊 I've retrieved the following information (${keys.length} fields):`;
      }
      
      return "Here's what I found:";
    };

    // Handle array of results from multiple tools
    if (Array.isArray(result)) {
      if (result.length === 0) {
        return "I completed the operation but there were no results to report.";
      }

      // Process each result and combine into a coherent response
      const responses = result.map(item => {
        if (item.status === 'failed') {
          return `I encountered an error while ${item.action?.description || 'processing your request'}: ${item.error}`;
        }

        // Extract the actual result data
        const data = item.result?.result || item.result;
        
        if (!data) {
          return `I completed ${item.tool || 'the operation'} successfully.`;
        }

        // Handle different types of data
        if (typeof data === 'object') {
          if (data.message) {
            return data.message;
          }
          // Convert meaningful object properties to natural text
          const details = Object.entries(data)
            .filter(([key]) => !['id', '_id', 'type', 'status'].includes(key))
            .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
            .join(', ');
          return details || `I completed ${item.tool || 'the operation'} successfully.`;
        }

        return String(data);
      });

      // Combine overview with detailed responses
      return `${generateOverview(result)}\n\n${responses.join('\n')}`;
    }

    // Handle single result
    if (typeof result === 'object') {
      let details = '';
      if (result.message) {
        details = result.message;
      } else if (result.error) {
        details = `I encountered an error: ${result.error}`;
      } else {
        // Convert object to readable text
        details = Object.entries(result)
          .filter(([key]) => !['id', '_id', 'type', 'status'].includes(key))
          .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
          .join(', ');
      }
      
      return details ? `${generateOverview(result)}\n\n${details}` : 'The operation completed successfully.';
    }

    return String(result);
  }

  // Utility methods
  public getContext(): AgentContext {
    return this.context;
  }

  public clearContext() {
    this.context = {
      messages: [{
        role: 'system',
        content: this.config.systemPrompt
      }]
    };
  }
} 