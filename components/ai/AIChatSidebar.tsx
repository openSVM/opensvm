'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chat } from './Chat';
import { useAIChatTabs } from '@/lib/ai/hooks/useAIChatTabs';
import { createSolanaAgent } from '@/lib/ai/core/factory';
import { Connection } from '@solana/web3.js';
import { Message } from '@/lib/ai/types';
import { generateAndShareScreenshot } from '@/lib/ai/utils/screenshot';

const connection = new Connection(
  process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com'
);

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onWidthChange: (width: number) => void;
  onResizeStart: () => void;
  onResizeEnd: () => void;
  initialWidth: number;
}

export const AIChatSidebar = memo(function AIChatSidebar({ 
  isOpen, 
  onClose, 
  onWidthChange,
  onResizeStart,
  onResizeEnd,
  initialWidth = 400 
}: Props) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(initialWidth);
  const agent = createSolanaAgent(connection);
  
  const {
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
    clearNotes,
    resetEverything,
    retryAction,
    setAgentMessages
  } = useAIChatTabs({ agent });

  const handleWidthChange = useCallback((newWidth: number) => {
    setSidebarWidth(newWidth);
    onWidthChange(newWidth);
  }, [onWidthChange]);

  const handleReset = useCallback(() => {
    resetEverything();
  }, [resetEverything]);

  const handleRetryAction = useCallback((id: string) => {
    retryAction(id);
  }, [retryAction]);

  const handleExport = useCallback(() => {
    try {
      // Get all messages from the chat
      const messages = Array.from(document.querySelectorAll('.px-4.py-2.rounded-lg'))
        .map(div => {
          const isUser = div.parentElement?.classList.contains('justify-end');
          const content = div.textContent || '';
          return content ? `${isUser ? 'You' : 'Assistant'}: ${content}\n\n` : '';
        })
        .filter(Boolean)
        .join('');

      if (!messages) {
        console.error('No messages found to export');
        return;
      }

      // Add header and timestamp
      const textContent = `OpenSVM Chat Export\n` +
        `Generated on: ${new Date().toLocaleString()}\n\n` +
        `${messages}`;

      // Create and download text file
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `opensvm-chat-${new Date().toISOString().split('T')[0]}.txt`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      console.log('Chat exported successfully');
    } catch (error) {
      console.error('Error exporting chat:', error);
    }
  }, []);

  const handleShare = useCallback(async () => {
    try {
      // Create a temporary container for the screenshot
      const screenshotContainer = document.createElement('div');
      screenshotContainer.style.position = 'absolute';
      screenshotContainer.style.left = '-9999px';
      screenshotContainer.style.width = '800px'; // Fixed width for consistent screenshots
      screenshotContainer.style.backgroundColor = '#000';
      document.body.appendChild(screenshotContainer);

      // Clone the chat content
      const chatContent = document.querySelector('.overflow-y-auto');
      if (!chatContent) return;

      const clone = chatContent.cloneNode(true) as HTMLElement;
      // Remove any unnecessary elements from the clone
      clone.querySelectorAll('button').forEach(btn => btn.remove());
      
      // Style the clone for screenshot
      clone.style.padding = '20px';
      clone.style.width = '100%';
      clone.style.height = 'auto';
      clone.style.overflow = 'visible';
      clone.style.backgroundColor = '#000';
      clone.style.color = '#fff';

      screenshotContainer.appendChild(clone);

      // Generate and share screenshot
      await generateAndShareScreenshot(
        screenshotContainer,
        "checkout new explorer: opensvm.com $SVMAI"
      );

      // Cleanup
      document.body.removeChild(screenshotContainer);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, []);

  const handleSettings = useCallback(() => {
    // Open settings modal/panel
    console.log('Open settings');
  }, []);

  const handleHelp = useCallback(() => {
    // Add help message to chat
    const helpMessage: Message = {
      role: 'assistant',
      content: `### Solana Blockchain Assistant Help

Here are some things I can help you with:

1. **Transaction Analysis**
   - Get transaction details
   - Track token transfers
   - Monitor program interactions

2. **Account Information**
   - Check wallet balances
   - View token holdings
   - Track account activity

3. **Program Monitoring**
   - Track program usage
   - Monitor smart contract interactions
   - Analyze program statistics

4. **PumpFun Integration**
   - Monitor token prices
   - Track bonding curves
   - Execute trades
   - Listen for price updates

To get started, just ask me anything about Solana blockchain data or PumpFun trading!`
    };
    setAgentMessages(prev => [...prev, helpMessage]);
  }, [setAgentMessages]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 800) {
        setSidebarWidth(newWidth);
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      onResizeEnd();
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange, onResizeEnd]);

  if (!isOpen) return null;

  return (
    <Chat 
      variant="sidebar" 
      isOpen={isOpen}
      onClose={onClose}
      onWidthChange={handleWidthChange}
      onResizeStart={onResizeStart}
      onResizeEnd={onResizeEnd}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onReset={handleReset}
      onNewChat={handleNewChat}
      messages={messages}
      input={input}
      isProcessing={isProcessing}
      onInputChange={setInput}
      onSubmit={handleSubmit}
      notes={notes}
      onClearNotes={clearNotes}
      agentActions={agentActions}
      onRetryAction={handleRetryAction}
      onExport={handleExport}
      onShare={handleShare}
      onSettings={handleSettings}
      onHelp={handleHelp}
      className="transition-transform duration-200"
    />
  );
}); 