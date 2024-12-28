'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Plus, Maximize2, RotateCcw, MoreHorizontal } from 'lucide-react';
import { Input } from './ui/input';
import { sendMessageToAnthropic } from '@/lib/anthropic';
import { PublicKey, Connection } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Note {
  id: string;
  content: string;
  author: 'user' | 'assistant' | 'agent';
  timestamp: number;
}

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AgentAction {
  type: 
    // Navigation actions
    | 'navigate' 
    | 'search' 
    | 'analyze' 
    | 'execute'
    // Solana-specific actions
    | 'fetch_transaction'
    | 'fetch_account'
    | 'fetch_token'
    | 'fetch_nft'
    | 'analyze_wallet'
    | 'track_program'
    | 'monitor_transactions'
    | 'decode_instruction'
    | 'rank_wallets';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  description: string;
  requires_confirmation?: boolean;
  dependencies?: string[]; // IDs of actions this depends on
  rollback_action?: () => Promise<void>;
  preview?: string;
  id: string;
  error?: string;
  context?: {
    workspace?: string;
    chain_id?: string;
    program_id?: string;
    relevant_accounts?: string[];
  };
}

interface ActionWorkspace {
  id: string;
  name: string;
  description: string;
  actions: AgentAction[];
  context: {
    chain_id: string;
    program_ids: string[];
    accounts: string[];
    created_at: number;
    updated_at: number;
  };
}

interface Suggestion {
  text: string;
  icon?: string;
  type: 'fix' | 'feature' | 'general';
}

export function AIChatSidebar({ isOpen, onClose }: AIChatSidebarProps) {
  const [agentMessages, setAgentMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am a Solana blockchain agent that can help you analyze on-chain data. I will verify all information before sharing it. For example, I can:\n\n' +
        '• Find specific wallet activity and balances\n' +
        '• Verify transaction details and decode instructions\n' +
        '• Check token information and holder statistics\n' +
        '• Monitor program usage\n\n' +
        'What would you like me to verify on Solana?'
    }
  ]);
  const [assistantMessages, setAssistantMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I am an AI assistant focused on Solana and blockchain. I can help with explanations and analysis using my knowledge, agent\'s insights, shared notes, and API data. I\'ll ask for your confirmation before taking any actions. How can I assist you?'
    }
  ]);
  const [agentInput, setAgentInput] = useState('');
  const [assistantInput, setAssistantInput] = useState('');
  const [activeTab, setActiveTab] = useState('agent');
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [agentActions, setAgentActions] = useState<AgentAction[]>([]);
  const [isAgentWorking, setIsAgentWorking] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [pageContext, setPageContext] = useState<{
    currentUrl: string;
    pageContent: string;
    selectedElements: string[];
  }>({
    currentUrl: '',
    pageContent: '',
    selectedElements: []
  });
  const [virtualMouse, setVirtualMouse] = useState<{
    x: number;
    y: number;
    isVisible: boolean;
    tooltip: string;
  }>({
    x: 0,
    y: 0,
    isVisible: false,
    tooltip: ''
  });
  const [workspaces, setWorkspaces] = useState<ActionWorkspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [actionQueue, setActionQueue] = useState<AgentAction[]>([]);
  const [actionHistory, setActionHistory] = useState<AgentAction[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [availableCommands, setAvailableCommands] = useState<{
    id: string;
    name: string;
    description: string;
    action: () => void;
  }[]>([]);
  const [connection, setConnection] = useState<Connection | null>(null);

  // Initialize Solana connection
  useEffect(() => {
    const conn = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    setConnection(conn);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (!isMaximized) {
      setWidth(window.innerWidth);
    } else {
      setWidth(400);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'agent') {
      setAgentMessages([{
        role: 'assistant',
        content: 'Hello! I am an autonomous agent that can help analyze content and perform actions on the current page to achieve your goals. I can search within the page, analyze content, and interact with UI elements like buttons and forms. What would you like me to do with the content on this page?'
      }]);
      setAgentInput('');
    } else if (activeTab === 'assistant') {
      setAssistantMessages([{
        role: 'assistant',
        content: 'Hi! I am an AI assistant focused on Solana and blockchain. I can help with explanations and analysis using my knowledge, agent\'s insights, shared notes, and API data. I\'ll ask for your confirmation before taking any actions. How can I assist you?'
      }]);
      setAssistantInput('');
    }
  };

  const handleNewChat = () => {
    handleRefresh();
    setActiveTab('agent');
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 800) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const addNote = (content: string, author: Note['author']) => {
    const newNote: Note = {
      id: Date.now().toString(),
      content,
      author,
      timestamp: Date.now()
    };
    setNotes(prev => [...prev, newNote]);
    setNoteInput('');
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    addNote(noteInput, 'user');
  };

  const generateSuggestions = async (messages: Message[]) => {
    try {
      const response = await sendMessageToAnthropic([
        ...messages,
        { 
          role: 'system', 
          content: 'Generate 3-5 relevant next user prompts based on the conversation. Format as [SUGGESTION]type:text[/SUGGESTION]. Types: fix, feature, general' 
        }
      ]);

      const suggestionMatches = response.match(/\[SUGGESTION\](.*?)\[\/SUGGESTION\]/g) || [];
      const newSuggestions: Suggestion[] = suggestionMatches.map(match => {
        const [type, text] = match.replace('[SUGGESTION]', '').replace('[/SUGGESTION]', '').split(':');
        return {
          type: type as Suggestion['type'],
          text,
          icon: type === 'fix' ? '🔧' : type === 'feature' ? '💡' : '❓'
        };
      });

      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };

  // Listen for page changes
  useEffect(() => {
    const handleRouteChange = () => {
      setPageContext(prev => ({
        ...prev,
        currentUrl: window.location.href,
        pageContent: document.body.innerText
      }));
    };

    // Initial page load
    handleRouteChange();

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    // Save context to localStorage when component unmounts
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      localStorage.setItem('agentContext', JSON.stringify({
        messages: agentMessages,
        actions: agentActions,
        context: pageContext
      }));
    };
  }, []);

  // Restore context on mount
  useEffect(() => {
    const savedContext = localStorage.getItem('agentContext');
    if (savedContext) {
      const { messages, actions, context } = JSON.parse(savedContext);
      setAgentMessages(messages);
      setAgentActions(actions);
      setPageContext(context);
    }
  }, []);

  const VirtualMouse = () => {
    if (!virtualMouse.isVisible) return null;
    
    return (
      <div 
        className="fixed pointer-events-none z-50"
        style={{ 
          left: virtualMouse.x,
          top: virtualMouse.y,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="relative">
          <div className="text-2xl">^</div>
          <div className="absolute left-full ml-2 top-0 bg-[#000000] text-[#FFFFFF] px-2 py-1 text-xs rounded whitespace-nowrap">
            AI {virtualMouse.tooltip && `- ${virtualMouse.tooltip}`}
          </div>
        </div>
      </div>
    );
  };

  const moveMouseTo = async (element: Element, action: string) => {
    setVirtualMouse(prev => ({ ...prev, isVisible: true }));
    
    const rect = element.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;
    
    // Start from current position or center of screen
    const startX = virtualMouse.x || window.innerWidth / 2;
    const startY = virtualMouse.y || window.innerHeight / 2;
    
    // Animate mouse movement
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const x = startX + (targetX - startX) * progress;
      const y = startY + (targetY - startY) * progress;
      
      setVirtualMouse(prev => ({
        ...prev,
        x,
        y,
        tooltip: action
      }));
      
      await new Promise(r => setTimeout(r, 25)); // 25ms per step = ~500ms total
    }
    
    // Show click effect
    setVirtualMouse(prev => ({ ...prev, tooltip: `${action} (clicking)` }));
    await new Promise(r => setTimeout(r, 500));
    
    return { x: targetX, y: targetY };
  };

  const executeAction = async (action: AgentAction) => {
    if (!connection) {
      throw new Error('Solana connection not initialized');
    }
    
    switch (action.type) {
      case 'fetch_transaction': {
        try {
          // Verify transaction exists before proceeding
          const signature = action.description.match(/[1-9A-HJ-NP-Za-km-z]{88}/)?.[0];
          if (!signature) {
            throw new Error('Invalid transaction signature format');
          }
          
          const tx = await connection.getParsedTransaction(signature);
          if (!tx) {
            throw new Error('Transaction not found');
          }

          return { 
            success: true, 
            data: {
              signature,
              slot: tx.slot,
              blockTime: tx.blockTime,
              status: tx.meta?.err ? 'failed' : 'success'
            }
          };
        } catch (error) {
          throw new Error(`Transaction verification failed: ${error.message}`);
        }
      }

      case 'fetch_account': {
        try {
          // Verify account exists before proceeding
          const address = action.description.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/)?.[0];
          if (!address) {
            throw new Error('Invalid account address format');
          }

          const accountInfo = await connection.getAccountInfo(new PublicKey(address));
          if (!accountInfo) {
            throw new Error('Account not found');
          }

          return {
            success: true,
            data: {
              address,
              lamports: accountInfo.lamports,
              owner: accountInfo.owner.toString(),
              executable: accountInfo.executable
            }
          };
        } catch (error) {
          throw new Error(`Account verification failed: ${error.message}`);
        }
      }

      case 'fetch_token': {
        try {
          // Verify token exists before proceeding
          const address = action.description.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/)?.[0];
          if (!address) {
            throw new Error('Invalid token address format');
          }

          const mint = await getMint(connection, new PublicKey(address));
          if (!mint) {
            throw new Error('Token not found');
          }

          return {
            success: true,
            data: {
              address,
              decimals: mint.decimals,
              supply: mint.supply.toString(),
              freezeAuthority: mint.freezeAuthority?.toString(),
              mintAuthority: mint.mintAuthority?.toString()
            }
          };
        } catch (error) {
          throw new Error(`Token verification failed: ${error.message}`);
        }
      }

      case 'analyze_wallet': {
        try {
          // Verify wallet exists and has activity
          const address = action.description.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/)?.[0];
          if (!address) {
            throw new Error('Invalid wallet address format');
          }

          const [accountInfo, signatures] = await Promise.all([
            connection.getAccountInfo(new PublicKey(address)),
            connection.getSignaturesForAddress(new PublicKey(address), { limit: 1 })
          ]);

          if (!accountInfo) {
            throw new Error('Wallet not found');
          }

          return {
            success: true,
            data: {
              address,
              balance: accountInfo.lamports,
              hasActivity: signatures.length > 0,
              recentSignature: signatures[0]?.signature
            }
          };
        } catch (error) {
          throw new Error(`Wallet verification failed: ${error.message}`);
        }
      }

      case 'track_program': {
        try {
          // Verify program exists and is executable
          const address = action.description.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/)?.[0];
          if (!address) {
            throw new Error('Invalid program address format');
          }

          const programInfo = await connection.getAccountInfo(new PublicKey(address));
          if (!programInfo) {
            throw new Error('Program not found');
          }
          
          if (!programInfo.executable) {
            throw new Error('Account is not an executable program');
          }

          return {
            success: true,
            data: {
              address,
              dataSize: programInfo.data.length,
              upgradeAuthority: programInfo.owner.toString()
            }
          };
        } catch (error) {
          throw new Error(`Program verification failed: ${error.message}`);
        }
      }

      case 'rank_wallets': {
        try {
          const limit = parseInt(action.description.match(/\d+/)?.[0] || '10');
          
          // Get recent blocks to analyze
          const slot = await connection.getSlot();
          const blocks = await Promise.all(
            Array.from({ length: 100 }, (_, i) => 
              connection.getBlock(slot - i, { maxSupportedTransactionVersion: 0 })
            )
          );

          // Track wallet activity
          const walletActivity = new Map<string, {
            transactions: number;
            volume: number;
            lastActive: number;
          }>();

          // Analyze blocks
          blocks.forEach(block => {
            if (!block) return;
            block.transactions.forEach(tx => {
              if (!tx.meta) return;

              // Get fee payer - handle both legacy and versioned transactions
              let feePayer: string;
              if ('accountKeys' in tx.transaction.message) {
                // Legacy transaction
                feePayer = tx.transaction.message.accountKeys[0].toString();
              } else {
                // Versioned transaction
                const accountKeys = tx.transaction.message.getAccountKeys();
                feePayer = accountKeys.get(0)!.toString();
              }
              
              // Update activity
              const activity = walletActivity.get(feePayer) || {
                transactions: 0,
                volume: 0,
                lastActive: block.blockTime || 0
              };

              activity.transactions++;
              activity.volume += tx.meta.fee;
              activity.lastActive = Math.max(activity.lastActive, block.blockTime || 0);
              
              walletActivity.set(feePayer, activity);
            });
          });

          // Sort wallets by activity
          const topWallets = Array.from(walletActivity.entries())
            .sort((a, b) => b[1].transactions - a[1].transactions)
            .slice(0, limit)
            .map(([address, stats]) => ({
              address,
              transactions: stats.transactions,
              volume: stats.volume / 1e9, // Convert to SOL
              lastActive: new Date(stats.lastActive * 1000).toISOString()
            }));

          return {
            success: true,
            data: {
              timeframe: 'last 100 blocks',
              wallets: topWallets
            }
          };
        } catch (error) {
          throw new Error(`Wallet ranking failed: ${error.message}`);
        }
      }

      // ... existing navigation and UI actions ...

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  };

  const createWorkspace = (name: string, description: string) => {
    const workspace: ActionWorkspace = {
      id: `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      actions: [],
      context: {
        chain_id: '1', // Solana mainnet
        program_ids: [],
        accounts: [],
        created_at: Date.now(),
        updated_at: Date.now()
      }
    };
    setWorkspaces(prev => [...prev, workspace]);
    setActiveWorkspace(workspace.id);
    return workspace;
  };

  const updateWorkspace = (id: string, updates: Partial<ActionWorkspace>) => {
    setWorkspaces(prev => prev.map(w => 
      w.id === id ? { ...w, ...updates, context: { ...w.context, ...updates.context }, updated_at: Date.now() } : w
    ));
  };

  const deleteWorkspace = (id: string) => {
    setWorkspaces(prev => prev.filter(w => w.id !== id));
    if (activeWorkspace === id) {
      setActiveWorkspace(workspaces[0]?.id || null);
    }
  };

  // Command palette functionality
  const registerCommands = () => {
    const commands = [
      {
        id: 'workspace.create',
        name: 'Create Workspace',
        description: 'Create a new analysis workspace',
        action: () => {
          const name = prompt('Enter workspace name:');
          if (name) {
            createWorkspace(name, '');
          }
        }
      },
      {
        id: 'workspace.switch',
        name: 'Switch Workspace',
        description: 'Switch to another workspace',
        action: () => {
          const options = workspaces.map(w => ({
            label: w.name,
            value: w.id
          }));
          // TODO: Implement proper workspace switcher UI
          const selected = prompt('Select workspace:\n' + options.map((o, i) => `${i + 1}. ${o.label}`).join('\n'));
          if (selected) {
            const index = parseInt(selected) - 1;
            if (options[index]) {
              setActiveWorkspace(options[index].value);
            }
          }
        }
      },
      {
        id: 'action.retry',
        name: 'Retry Failed Action',
        description: 'Retry the last failed action',
        action: () => {
          const lastFailed = actionHistory.findLast(a => a.status === 'failed');
          if (lastFailed) {
            setActionQueue(prev => [lastFailed, ...prev]);
          }
        }
      },
      {
        id: 'action.rollback',
        name: 'Rollback Last Action',
        description: 'Rollback the last completed action',
        action: async () => {
          const lastCompleted = actionHistory.findLast(a => a.status === 'completed' && a.rollback_action);
          if (lastCompleted?.rollback_action) {
            try {
              await lastCompleted.rollback_action();
              setActionHistory(prev => prev.filter(a => a.id !== lastCompleted.id));
            } catch (error) {
              console.error('Failed to rollback action:', error);
            }
          }
        }
      }
    ];
    setAvailableCommands(commands);
  };

  useEffect(() => {
    registerCommands();
  }, [workspaces, actionHistory]);

  // Command palette UI
  const CommandPalette = () => {
    if (!isCommandPaletteOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-[20vh] z-50">
        <div className="bg-[#1E1E1E] w-[600px] rounded-lg shadow-xl">
          <div className="p-4">
            <input
              type="text"
              placeholder="Search commands..."
              className="w-full bg-[#2D2D2D] text-[#FFFFFF] px-4 py-3 rounded-lg"
              autoFocus
            />
          </div>
          <div className="border-t border-[#FFFFFF]/10">
            {availableCommands.map(cmd => (
              <button
                key={cmd.id}
                onClick={() => {
                  setIsCommandPaletteOpen(false);
                  cmd.action();
                }}
                className="w-full px-4 py-3 text-left hover:bg-[#2D2D2D] text-[#FFFFFF]"
              >
                <div className="font-medium">{cmd.name}</div>
                <div className="text-sm text-[#FFFFFF]/60">{cmd.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Add keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update validation to be more context-aware
  const validateResponse = async (response: string, actions: AgentAction[]) => {
    // Extract claims that need verification
    const addressClaims = response.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g) || [];
    const signatureClaims = response.match(/[1-9A-HJ-NP-Za-km-z]{88}/g) || [];
    const numericalClaims = response.match(/\d+(\.\d+)?\s*(SOL|lamports)/g) || [];

    if (!connection) {
      throw new Error('Cannot verify claims: Solana connection not initialized');
    }

    const verificationResults = {
      invalidAddresses: [] as string[],
      invalidSignatures: [] as string[],
      invalidAmounts: [] as string[],
      warnings: [] as string[]
    };

    // Verify addresses
    await Promise.all(addressClaims.map(async (address) => {
      try {
        const accountInfo = await connection.getAccountInfo(new PublicKey(address));
        if (!accountInfo) {
          verificationResults.invalidAddresses.push(address);
        }
      } catch {
        verificationResults.invalidAddresses.push(address);
      }
    }));

    // Verify signatures
    await Promise.all(signatureClaims.map(async (signature) => {
      try {
        const status = await connection.getSignatureStatus(signature);
        if (!status.value) {
          verificationResults.invalidSignatures.push(signature);
        }
      } catch {
        verificationResults.invalidSignatures.push(signature);
      }
    }));

    // Verify numerical claims
    numericalClaims.forEach(claim => {
      const amount = parseFloat(claim);
      if (isNaN(amount) || amount < 0) {
        verificationResults.invalidAmounts.push(claim);
      }
    });

    // Context-aware claim validation
    const contextPatterns = {
      // Patterns that are allowed in specific contexts
      allowedPatterns: {
        walletAnalysis: /top|highest|most active/i,
        timeBasedAnalysis: /recent|latest|last/i,
        tokenMetrics: /total supply|holders/i,
        programStats: /current|active/i
      },
      // Patterns that should always be verified
      strictPatterns: [
        {
          pattern: /is the largest|is the best|is the worst/i,
          warning: 'Unverified comparative claim'
        },
        {
          pattern: /always|never|every|all(?!\s+transactions|\s+holders|\s+accounts)/i,
          warning: 'Unverified absolute claim'
        },
        {
          pattern: /guaranteed|definitely|certainly/i,
          warning: 'Unverified certainty claim'
        }
      ]
    };

    // Check if claim is allowed in current context
    const isAllowedInContext = (text: string, action: AgentAction) => {
      switch (action.type) {
        case 'analyze_wallet':
          return contextPatterns.allowedPatterns.walletAnalysis.test(text);
        case 'monitor_transactions':
          return contextPatterns.allowedPatterns.timeBasedAnalysis.test(text);
        case 'fetch_token':
          return contextPatterns.allowedPatterns.tokenMetrics.test(text);
        case 'track_program':
          return contextPatterns.allowedPatterns.programStats.test(text);
        default:
          return false;
      }
    };

    // Check each action's description against context patterns
    actions.forEach(action => {
      contextPatterns.strictPatterns.forEach(({ pattern, warning }) => {
        if (pattern.test(action.description) && !isAllowedInContext(action.description, action)) {
          verificationResults.warnings.push(
            `${warning} in action: "${action.description}"`
          );
        }
      });
    });

    // Check dependencies
    actions.forEach(action => {
      if (action.dependencies?.length) {
        action.dependencies.forEach(depId => {
          const dependencyAction = actions.find(a => a.id === depId);
          if (!dependencyAction) {
            verificationResults.warnings.push(
              `Action "${action.description}" depends on missing action ID: ${depId}`
            );
          }
        });
      }
    });

    return verificationResults;
  };

  // Update handleAgentSubmit to show clear plan
  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim()) return;

    // Create default workspace if none exists
    if (!activeWorkspace) {
      createWorkspace('Default Workspace', 'Created automatically');
    }

    const userMessage = { role: 'user' as const, content: agentInput };
    setAgentMessages(prev => [...prev, userMessage]);
    setAgentInput('');
    setIsAgentWorking(true);
    setAgentActions([]);

    try {
      // Get workspace context
      const workspace = workspaces.find(w => w.id === activeWorkspace);
      
      // First, show that we're analyzing the request
      setAgentMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I will help you with that. Let me analyze your request...'
      }]);

      // Parse the request and create action plan
      const planResponse = await sendMessageToAnthropic([
        ...agentMessages.slice(0, -2),
        userMessage,
        {
          role: 'system',
          content: `Create a detailed plan to handle this request. Focus on Solana-specific actions like fetch_transaction, fetch_account, fetch_token, analyze_wallet, track_program, or rank_wallets. Format each action as [ACTION]type:description[/ACTION].`
        }
      ]);

      // Extract actions from plan
      const actions = extractActionsFromResponse(planResponse);
      
      if (actions.length === 0) {
        setAgentMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I apologize, but I could not determine the specific actions needed for your request. Could you please provide more details about what you would like me to analyze on Solana?'
        }]);
        setIsAgentWorking(false);
        return;
      }

      // Show the action plan with clear formatting
      setAgentMessages(prev => [...prev, {
        role: 'assistant',
        content: `Here's my plan to handle your request:\n\n${actions.map((action, i) => 
          `${i + 1}. ${action.description}`
        ).join('\n')}\n\nI will now execute these actions in sequence and verify all results.`
      }]);

      // Validate the plan
      const validationResults = await validateResponse(planResponse, actions);

      if (
        validationResults.invalidAddresses.length > 0 ||
        validationResults.invalidSignatures.length > 0 ||
        validationResults.invalidAmounts.length > 0 ||
        validationResults.warnings.length > 0
      ) {
        setAgentMessages(prev => [...prev, {
          role: 'assistant',
          content: `⚠️ Before proceeding, I need to address these validation issues:\n\n${[
            validationResults.invalidAddresses.length > 0 ? 
              `• Invalid addresses: ${validationResults.invalidAddresses.join(', ')}` : '',
            validationResults.invalidSignatures.length > 0 ?
              `• Invalid signatures: ${validationResults.invalidSignatures.join(', ')}` : '',
            validationResults.invalidAmounts.length > 0 ?
              `• Invalid amounts: ${validationResults.invalidAmounts.join(', ')}` : '',
            ...validationResults.warnings.map(w => `• ${w}`)
          ].filter(Boolean).join('\n')}\n\nPlease provide correct information or let me know if you'd like me to try a different approach.`
        }]);
        setIsAgentWorking(false);
        return;
      }

      // Update workspace and queue actions
      if (workspace) {
        updateWorkspace(workspace.id, {
          actions: [...workspace.actions, ...actions]
        });
      }

      setAgentActions(actions);
      setActionQueue(actions);

      // The action queue processor will handle execution
      setAgentMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Starting to execute the planned actions. I will update you on the progress...'
      }]);

    } catch (error) {
      console.error('Error in agent execution:', error);
      setAgentMessages(prev => [...prev, {
        role: 'assistant',
        content: `I encountered an error while planning: ${error.message}. Please try rephrasing your request.`
      }]);
      setIsAgentWorking(false);
    }
  };

  const extractActionsFromResponse = (response: string): AgentAction[] => {
    const actionMatches = response.match(/\[ACTION\](.*?)\[\/ACTION\]/g) || [];
    return actionMatches.map(match => {
      const [type, description] = match.replace('[ACTION]', '').replace('[/ACTION]', '').split(':');
      return {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: type as AgentAction['type'],
        status: 'pending' as const,
        description: description.trim(),
        requires_confirmation: false,
        context: {
          workspace: activeWorkspace || undefined
        }
      };
    });
  };

  const handleAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantInput.trim()) return;

    const userMessage = { role: 'user' as const, content: assistantInput };
    setAssistantMessages(prev => [...prev, userMessage]);
    setAssistantInput('');

    try {
      const response = await sendMessageToAnthropic([...assistantMessages, userMessage]);
      const assistantMessage = { 
        role: 'assistant' as const, 
        content: response
      };
      setAssistantMessages(prev => [...prev, assistantMessage]);
      
      if (response.includes("[NOTE]")) {
        const noteContent = response.split("[NOTE]")[1].split("[/NOTE]")[0].trim();
        addNote(noteContent, 'assistant');
      }
      
      // Generate new suggestions
      await generateSuggestions(assistantMessages);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = { 
        role: 'assistant' as const, 
        content: 'Sorry, I encountered an error processing your request. Please try again.' 
      };
      setAssistantMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (activeTab === 'agent') {
      setAgentInput(suggestion);
      handleAgentSubmit({ preventDefault: () => {} } as React.FormEvent);
    } else {
      setAssistantInput(suggestion);
      handleAssistantSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  const renderActionStatus = (action: AgentAction) => {
    const getStatusIcon = () => {
      switch (action.status) {
        case 'completed':
          return <span className="text-[#00FF00] text-base">✓</span>;
        case 'failed':
          return <span className="text-[#FF0000] text-base">×</span>;
        case 'in_progress':
          return (
            <div className="loader">
              <span></span>
              <span></span>
              <span></span>
            </div>
          );
        default:
          return <span className="text-[#FFFFFF] opacity-50">○</span>;
      }
    };

    return (
      <div className="flex items-baseline gap-2 px-4 py-1">
        {getStatusIcon()}
        <span className={`text-base ${
          action.status === 'completed' ? 'text-[#00FF00]' :
          action.status === 'failed' ? 'text-[#FF0000]' :
          action.status === 'in_progress' ? 'text-[#FFFFFF]' :
          'text-[#FFFFFF] opacity-50'
        }`}>
          {action.description}
        </span>
        {action.error && (
          <span className="text-[#FF0000] text-sm ml-2">
            {action.error}
          </span>
        )}
      </div>
    );
  };

  const renderAgentStatus = () => {
    if (agentActions.length === 0) return null;

    return (
      <div className="flex-shrink-0">
        <div className="space-y-1">
          {agentActions.map((action) => (
            <div key={action.id}>
              {renderActionStatus(action)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSuggestions = () => {
    if (suggestions.length === 0 || isAgentWorking) return null;

    const displayedSuggestions = showAllSuggestions ? suggestions : suggestions.slice(0, 2);

    return (
      <div className="flex-shrink-0 border-t border-[#FFFFFF]">
        <div className="p-4 space-y-2">
          {displayedSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion.text)}
              className="w-full text-left p-3 bg-[#2D2D2D] text-[#FFFFFF] text-sm flex items-start gap-2"
            >
              <span className="flex-shrink-0 w-5 text-center">{suggestion.icon}</span>
              <span className="flex-1">{suggestion.text}</span>
            </button>
          ))}
          {suggestions.length > 2 && (
            <button
              onClick={() => setShowAllSuggestions(!showAllSuggestions)}
              className="w-full text-center p-2 text-[#FFFFFF] text-sm"
            >
              {showAllSuggestions ? 'Show fewer suggestions' : 'Show more suggestions'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'agent':
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 min-h-0">
              <div className="h-full overflow-y-auto overflow-x-hidden">
                <div className="p-4 space-y-4">
                  {agentMessages.map((message, i) => (
                    <div
                      key={i}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
                    >
                      <div
                        className={`px-4 py-2 max-w-[80%] break-words ${
                          message.role === 'user'
                            ? 'bg-[#D85B00] text-[#FFFFFF]'
                            : 'bg-[#2D2D2D] text-[#FFFFFF]'
                        }`}
                        style={{
                          filter: 'drop-shadow(2px 4px 3px rgba(0, 0, 0, 0.5))'
                        }}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {renderAgentStatus()}
            {renderSuggestions()}
            <div className="flex-shrink-0 p-4 border-t border-[#FFFFFF]">
              <form onSubmit={handleAgentSubmit} className="relative">
                <input
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  placeholder={isAgentWorking ? "Agent is working..." : "Ask a question..."}
                  disabled={isAgentWorking}
                  className="w-full bg-[#1E1E1E] text-[#FFFFFF] px-4 py-3 rounded-lg placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isAgentWorking}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 disabled:opacity-50"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 2L2 18M18 2H2M18 2V18" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        );
      case 'assistant':
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 min-h-0">
              <div className="h-full overflow-y-auto overflow-x-hidden">
                <div className="p-4 space-y-4">
                  {assistantMessages.map((message, i) => (
                    <div
                      key={i}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
                    >
                      <div
                        className={`px-4 py-2 max-w-[80%] break-words ${
                          message.role === 'user'
                            ? 'bg-[#D85B00] text-[#FFFFFF]'
                            : 'bg-[#2D2D2D] text-[#FFFFFF]'
                        }`}
                        style={{
                          filter: 'drop-shadow(2px 4px 3px rgba(0, 0, 0, 0.5))'
                        }}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {renderSuggestions()}
            <div className="flex-shrink-0 p-4 border-t border-[#FFFFFF]">
              <form onSubmit={handleAssistantSubmit} className="relative">
                <input
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full bg-[#1E1E1E] text-[#FFFFFF] px-4 py-3 rounded-lg placeholder:text-gray-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 2L2 18M18 2H2M18 2V18" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        );
      case 'notes':
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {notes.map((note) => (
                <div 
                  key={note.id}
                  className="bg-[#2D2D2D] p-3 text-[#FFFFFF]"
                >
                  <div className="text-sm mb-1 flex justify-between items-center">
                    <span className="text-[#D85B00]">{note.author.toUpperCase()}</span>
                    <span className="text-[#FFFFFF]/50 text-xs">
                      {new Date(note.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm">{note.content}</div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[#FFFFFF]">
              <form onSubmit={handleNoteSubmit} className="relative">
                <input
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full bg-[#1E1E1E] text-[#FFFFFF] px-4 py-3 rounded-lg placeholder:text-gray-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <Plus size={18} />
                </button>
              </form>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Add cleanup for virtual mouse
  useEffect(() => {
    return () => {
      setVirtualMouse({ x: 0, y: 0, isVisible: false, tooltip: '' });
    };
  }, []);

  // Add workspace selector to the UI
  const WorkspaceSelector = () => {
    if (workspaces.length === 0) return null;

    return (
      <div className="px-4 py-2 border-b border-[#FFFFFF]/10">
        <select
          value={activeWorkspace || ''}
          onChange={(e) => setActiveWorkspace(e.target.value)}
          className="w-full bg-[#2D2D2D] text-[#FFFFFF] px-2 py-1 rounded"
        >
          {workspaces.map(w => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Add action queue processor
  useEffect(() => {
    if (actionQueue.length === 0 || isAgentWorking) return;

    const processQueue = async () => {
      setIsAgentWorking(true);
      let completedActions = 0;
      const totalActions = actionQueue.length;
      
      try {
        const action = actionQueue[0];
        setAgentActions(prev => prev.map(a => 
          a.id === action.id ? { ...a, status: 'in_progress' } : a
        ));

        // Show progress
        setAgentMessages(prev => [...prev, {
          role: 'assistant',
          content: `Executing action ${completedActions + 1}/${totalActions}: ${action.description}`
        }]);

        // Check if action requires confirmation
        if (action.requires_confirmation) {
          const confirmed = window.confirm(
            `Do you want to proceed with this action?\n${action.description}\n${action.preview || ''}`
          );
          if (!confirmed) {
            setActionQueue(prev => prev.slice(1));
            setAgentActions(prev => prev.map(a => 
              a.id === action.id ? { ...a, status: 'failed', error: 'Action cancelled by user' } : a
            ));
            setAgentMessages(prev => [...prev, {
              role: 'assistant',
              content: '❌ Action cancelled by user'
            }]);
            return;
          }
        }

        // Check dependencies
        if (action.dependencies?.length) {
          const unfinishedDeps = action.dependencies.filter(depId => {
            const dep = actionHistory.find(a => a.id === depId);
            return !dep || dep.status !== 'completed';
          });
          
          if (unfinishedDeps.length > 0) {
            setActionQueue(prev => prev.slice(1));
            setAgentActions(prev => prev.map(a => 
              a.id === action.id ? { ...a, status: 'failed', error: 'Dependencies not met' } : a
            ));
            setAgentMessages(prev => [...prev, {
              role: 'assistant',
              content: '❌ Cannot proceed - required actions not completed'
            }]);
            return;
          }
        }

        const result = await executeAction(action);
        completedActions++;
        
        // Add to history
        setActionHistory(prev => [...prev, { ...action, status: 'completed' }]);
        
        // Update workspace context if needed
        if (action.context?.program_id || action.context?.relevant_accounts?.length) {
          const workspace = workspaces.find(w => w.id === activeWorkspace);
          if (workspace) {
            updateWorkspace(workspace.id, {
              context: {
                ...workspace.context,
                program_ids: [...new Set([...workspace.context.program_ids, action.context.program_id].filter(Boolean))],
                accounts: [...new Set([...workspace.context.accounts, ...(action.context.relevant_accounts || [])])],
                updated_at: Date.now()
              }
            });
          }
        }

        // Remove from queue and update status
        setActionQueue(prev => prev.slice(1));
        setAgentActions(prev => prev.map(a => 
          a.id === action.id ? { ...a, status: 'completed' } : a
        ));

        // Add result to messages with clear formatting
        setAgentMessages(prev => [...prev, {
          role: 'assistant',
          content: `✓ Action completed successfully:\n\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\``
        }]);

        // If this was the last action, add a summary
        if (completedActions === totalActions) {
          setAgentMessages(prev => [...prev, {
            role: 'assistant',
            content: '✓ All actions completed successfully. Let me know if you need anything else!'
          }]);
        }

      } catch (error) {
        console.error('Error executing action:', error);
        
        const currentAction = actionQueue[0];
        setActionQueue(prev => prev.slice(1));
        setAgentActions(prev => prev.map(a => 
          a.id === currentAction.id ? { ...a, status: 'failed', error: error.message } : a
        ));

        // Add error to messages with clear formatting
        setAgentMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ Error executing action:\n\`\`\`\n${error.message}\n\`\`\`\nLet me try an alternative approach...`
        }]);

        // Try to recover
        try {
          const recoveryResponse = await sendMessageToAnthropic([
            ...agentMessages,
            { 
              role: 'system', 
              content: `Action failed: ${error.message}\nProvide alternative approach with new [ACTION] items or [ABORT] if unrecoverable` 
            }
          ]);

          if (recoveryResponse.includes('[ACTION]')) {
            const recoveryActions = extractActionsFromResponse(recoveryResponse);
            setActionQueue(prev => [...recoveryActions, ...prev]);
            setAgentActions(prev => [...prev, ...recoveryActions]);
            setAgentMessages(prev => [...prev, {
              role: 'assistant',
              content: 'I will try a different approach:\n' + 
                recoveryActions.map(a => `• ${a.description}`).join('\n')
            }]);
          } else {
            throw new Error('No recovery possible');
          }
        } catch (recoveryError) {
          setAgentMessages(prev => [...prev, {
            role: 'assistant',
            content: `I couldn't find an alternative approach. Please try rephrasing your request or provide more specific information.`
          }]);
        }
      } finally {
        if (actionQueue.length === 0) {
          setIsAgentWorking(false);
        }
      }
    };

    processQueue();
  }, [actionQueue, isAgentWorking]);

  if (!isOpen) return null;

  return (
    <>
      <CommandPalette />
      <div 
        ref={sidebarRef}
        style={{ width: isMaximized ? '100vw' : `${width}px` }}
        className={`flex flex-col bg-[#000000] text-[#FFFFFF] border-l border-[#FFFFFF] relative ${
          isMaximized 
            ? 'fixed inset-0' 
            : 'h-[calc(100vh-57px)]'
        }`}
      >
        {/* Resize Handle */}
        {!isMaximized && (
          <div
            className="absolute left-0 top-0 w-1 h-full cursor-ew-resize bg-[#FFFFFF]"
            onMouseDown={() => setIsResizing(true)}
          >
            <div className="absolute left-0 top-0 w-1 h-full bg-[#FFFFFF]" />
          </div>
        )}

        {/* Header with Tabs */}
        <div className="flex items-center border-b border-[#FFFFFF]">
          {/* Tabs */}
          <div className="flex flex-1">
            {['agent', 'assistant', 'notes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm ${
                  activeTab === tab 
                    ? 'bg-[#FFFFFF] text-[#000000]'
                    : 'text-[#FFFFFF]'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
          {/* Action buttons */}
          <div className="flex items-center px-2 space-x-2">
            <button 
              onClick={handleMaximize}
              className="p-1.5 text-[#FFFFFF]"
            >
              <Maximize2 size={18} />
            </button>
            <button 
              onClick={handleRefresh}
              className="p-1.5 text-[#FFFFFF]"
            >
              <RotateCcw size={18} />
            </button>
            <button 
              onClick={handleNewChat}
              className="p-1.5 text-[#FFFFFF]"
            >
              <Plus size={18} />
            </button>
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 text-[#FFFFFF]"
              >
                <MoreHorizontal size={18} />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#000000] border border-[#FFFFFF] py-1 z-50">
                  <button 
                    onClick={() => {
                      setNotes([]);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#FFFFFF] hover:bg-[#FFFFFF] hover:text-[#000000]"
                  >
                    Clear All Notes
                  </button>
                  <button 
                    onClick={() => {
                      handleRefresh();
                      setNotes([]);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#FFFFFF] hover:bg-[#FFFFFF] hover:text-[#000000]"
                  >
                    Reset Everything
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#FFFFFF]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <WorkspaceSelector />

        {renderTabContent()}
      </div>
    </>
  );
} 