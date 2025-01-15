import { useState } from 'react';
import { Message, Note, AgentAction } from '../types';
import { SolanaAgent } from '../core/agent';
import { SOLANA_RPC_KNOWLEDGE, PUMPFUN_KNOWLEDGE } from '../core/knowledge';

interface UseAIChatTabsProps {
  agent: SolanaAgent;
}

const createSystemNotes = (): Note[] => ([
  {
    id: 'pumpfun-program',
    content: JSON.stringify(PUMPFUN_KNOWLEDGE, null, 2),
    author: 'assistant',
    timestamp: Date.now()
  },
  {
    id: 'solana-rpc',
    content: JSON.stringify(SOLANA_RPC_KNOWLEDGE, null, 2),
    author: 'assistant',
    timestamp: Date.now()
  }
]);

export function useAIChatTabs({ agent }: UseAIChatTabsProps) {
  const [activeTab, setActiveTab] = useState('agent');
  const [agentMessages, setAgentMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `#### I'm your Solana blockchain assistant. I can help you analyze on-chain data and interact with pump.fun.

##### Available commands:

* Get transaction details
* Check account balances and token holdings
* Analyze wallet activity
* Track program usage
* Monitor pump.fun tokens
* Track bonding curves
* Execute pump.fun trades

##### What would you like to check on Solana?`
  }]);
  const [assistantMessages, setAssistantMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'I\'m an AI assistant focused on Solana and blockchain. I can help with explanations and analysis using my knowledge and API data. How can I assist you?'
  }]);
  const [notes, setNotes] = useState<Note[]>(createSystemNotes());
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentActions, setAgentActions] = useState<AgentAction[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim()
    };

    setInput('');
    setIsProcessing(true);

    if (activeTab === 'agent') {
      setAgentMessages(prev => [...prev, userMessage]);

      try {
        // First get the plan with actions
        const planResponse = await agent.processMessage({
          role: 'system',
          content: `You are a Solana blockchain agent with access to RPC methods. Create a plan to handle this request: "${userMessage.content}" using available methods: ${Object.keys(SOLANA_RPC_KNOWLEDGE).join(', ')}. Format actions as [ACTION]type:description[/ACTION].`
        });

        const actions = extractActionsFromResponse(planResponse.content);
        
        if (actions.length === 0) {
          setAgentMessages(prev => [...prev, {
            role: 'assistant',
            content: `I need more specific information about what you would like me to check on Solana. Please provide details like transaction signatures, wallet addresses, or token mints.`
          }]);
          setIsProcessing(false);
          return;
        }

        // Add the plan to messages
        setAgentMessages(prev => [...prev, {
          role: 'assistant',
          content: `**I will execute these actions:**\n${actions.map((action, i) => `${i + 1}. ${action.description}`).join('\n')}`
        }]);

        // Execute each action in sequence
        const results = [];
        for (const action of actions) {
          try {
            // Update current action to in_progress
            setAgentActions(prev => [...prev, { ...action, status: 'in_progress' }]);

            // Execute the action
            const actionResponse = await agent.processMessage({
              role: 'user',
              content: action.description
            });

            // Add result
            results.push({
              action,
              response: actionResponse,
              status: 'completed' as const
            });

            // Update action status
            setAgentActions(prev => 
              prev.map(a => a.id === action.id 
                ? { ...a, status: 'completed' as const }
                : a
              )
            );

          } catch (error) {
            console.error(`Error executing action ${action.description}:`, error);
            results.push({
              action,
              error: error.message,
              status: 'failed' as const
            });

            // Update action status
            setAgentActions(prev => 
              prev.map(a => a.id === action.id 
                ? { ...a, status: 'failed' as const, error: error.message }
                : a
              )
            );
          }
        }

        // Add results to messages
        for (const result of results) {
          if (result.status === 'completed') {
            const response = result.response;
            if (response.metadata?.data) {
              setAgentMessages(prev => [...prev, {
                role: 'assistant',
                content: `Action completed: ${result.action.description}\n\`\`\`json\n${JSON.stringify(response.metadata.data, null, 2)}\n\`\`\``
              }]);
            } else {
              setAgentMessages(prev => [...prev, response]);
            }
          } else {
            setAgentMessages(prev => [...prev, {
              role: 'assistant',
              content: `**Error executing action:** ${result.action.description}\n${result.error}`
            }]);
          }
        }

        // Add summary message
        const successCount = results.filter(r => r.status === 'completed').length;
        const failureCount = results.filter(r => r.status === 'failed').length;
        setAgentMessages(prev => [...prev, {
          role: 'assistant',
          content: `**Execution Summary:**\n- ${successCount} action${successCount !== 1 ? 's' : ''} completed successfully\n- ${failureCount} action${failureCount !== 1 ? 's' : ''} failed${failureCount > 0 ? '\n\nYou can retry failed actions using the retry button.' : ''}`
        }]);

      } catch (error) {
        console.error('Error in agent execution:', error);
        setAgentMessages(prev => [...prev, {
          role: 'assistant',
          content: `**Error:** ${error.message}. Please try again with more specific information.`
        }]);
      }
    } else if (activeTab === 'assistant') {
      setAssistantMessages(prev => [...prev, userMessage]);
      try {
        const response = await agent.processMessage(userMessage);
        setAssistantMessages(prev => [...prev, response]);
      } catch (error) {
        console.error('Error processing message:', error);
        setAssistantMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I encountered an error while processing your request. Please try again.'
        }]);
      }
    } else if (activeTab === 'notes') {
      const newNote: Note = {
        id: Date.now().toString(),
        content: input.trim(),
        author: 'user',
        timestamp: Date.now()
      };
      setNotes(prev => [...prev, newNote]);
    }

    setIsProcessing(false);
  };

  const extractActionsFromResponse = (response: string): AgentAction[] => {
    const actionMatches = response.match(/\[ACTION\](.*?)\[\/ACTION\]/g) || [];
    return actionMatches.map(match => {
      const [type, description] = match.replace('[ACTION]', '').replace('[/ACTION]', '').split(':');
      return {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: type.toLowerCase() as AgentAction['type'],
        status: 'pending' as const,
        description: description.trim()
      };
    });
  };

  const startRecording = () => {
    try {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        setInput(speechResult);
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Speech recognition is not supported in this browser.');
    }
  };

  const handleNewChat = () => {
    if (activeTab === 'agent') {
      agent.clearContext();
      setAgentMessages([{
        role: 'assistant',
        content: `#### I'm your Solana blockchain assistant. I can help you analyze on-chain data and interact with pump.fun.

##### Available commands:

* Get transaction details
* Check account balances and token holdings
* Analyze wallet activity
* Track program usage
* Monitor pump.fun tokens
* Track bonding curves
* Execute pump.fun trades

##### What would you like to check on Solana?`
      }]);
      setAgentActions([]);
    } else if (activeTab === 'assistant') {
      agent.clearContext();
      setAssistantMessages([{
        role: 'assistant',
        content: 'I\'m an AI assistant focused on Solana and blockchain. I can help with explanations and analysis using my knowledge and API data. How can I assist you?'
      }]);
    }
  };

  const clearNotes = () => {
    setNotes(createSystemNotes());
  };

  const resetEverything = () => {
    agent.clearContext();
    setAgentMessages([{
      role: 'assistant',
      content: `#### I'm your Solana blockchain assistant. I can help you analyze on-chain data and interact with pump.fun.

##### Available commands:

* Get transaction details
* Check account balances and token holdings
* Analyze wallet activity
* Track program usage
* Monitor pump.fun tokens
* Track bonding curves
* Execute pump.fun trades

##### What would you like to check on Solana?`
    }]);
    setAssistantMessages([{
      role: 'assistant',
      content: 'I\'m an AI assistant focused on Solana and blockchain. I can help with explanations and analysis using my knowledge and API data. How can I assist you?'
    }]);
    clearNotes();
    setAgentActions([]);
  };

  const retryAction = async (actionId: string) => {
    const action = agentActions.find(a => a.id === actionId);
    if (!action) return;

    try {
      // Update action status to in_progress
      setAgentActions(prev => prev.map(a => 
        a.id === actionId 
          ? { ...a, status: 'in_progress' as const, error: undefined }
          : a
      ));

      // Execute the specific action
      const executionResponse = await agent.processMessage({
        role: 'user',
        content: action.description
      });

      // Update action status to completed
      setAgentActions(prev => prev.map(a => 
        a.id === actionId 
          ? { ...a, status: 'completed' as const }
          : a
      ));

      // Add the response to messages
      if (executionResponse.metadata?.data) {
        setAgentMessages(prev => [...prev, {
          role: 'assistant',
          content: `Retried action completed successfully:\n\`\`\`json\n${JSON.stringify(executionResponse.metadata.data, null, 2)}\n\`\`\``
        }]);
      } else {
        setAgentMessages(prev => [...prev, executionResponse]);
      }

    } catch (error) {
      console.error('Error retrying action:', error);
      // Update action status to failed
      setAgentActions(prev => prev.map(a => 
        a.id === actionId 
          ? { ...a, status: 'failed' as const, error: error.message }
          : a
      ));
      setAgentMessages(prev => [...prev, {
        role: 'assistant',
        content: `**Error retrying action:** ${error.message}`
      }]);
    }
  };

  const messages = activeTab === 'agent' ? agentMessages : 
                  activeTab === 'assistant' ? assistantMessages : [];

  return {
    activeTab,
    setActiveTab,
    messages,
    input,
    isProcessing,
    setInput,
    handleSubmit,
    handleNewChat,
    notes,
    agentActions,
    setAgentActions,
    clearNotes,
    resetEverything,
    retryAction,
    setAgentMessages,
    startRecording,
    isRecording
  };
} 