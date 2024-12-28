'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Plus, Maximize2, RotateCcw, MoreHorizontal } from 'lucide-react';
import { Input } from './ui/input';
import { sendMessageToAnthropic } from '@/lib/anthropic';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatSidebar({ isOpen, onClose }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! How can I help you analyze Solana transactions today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('agent');
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await sendMessageToAnthropic([...messages, userMessage]);
      const assistantMessage = { 
        role: 'assistant' as const, 
        content: response
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Add error message to chat
      const errorMessage = { 
        role: 'assistant' as const, 
        content: 'Sorry, I encountered an error processing your request. Please try again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div 
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      className="h-[calc(100vh-57px)] flex flex-col bg-[#1E1E1E] text-white border-l border-gray-800 relative"
    >
      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 w-1 h-full cursor-ew-resize hover:bg-[#44ccff]/20 group"
        onMouseDown={() => setIsResizing(true)}
      >
        <div className="absolute left-0 top-0 w-1 h-full opacity-0 group-hover:opacity-100 bg-[#44ccff]/40" />
      </div>

      {/* Header with Tabs */}
      <div className="flex items-center border-b border-gray-800">
        {/* Tabs */}
        <div className="flex flex-1">
          {['agent', 'assistant', 'notes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === tab 
                  ? 'border-b-2 border-[#44ccff] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
        {/* Action buttons */}
        <div className="flex items-center px-2 space-x-2">
          <button className="p-1.5 hover:bg-gray-800 rounded">
            <Maximize2 size={18} />
          </button>
          <button className="p-1.5 hover:bg-gray-800 rounded">
            <RotateCcw size={18} />
          </button>
          <button className="p-1.5 hover:bg-gray-800 rounded">
            <MoreHorizontal size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-y-auto p-4 space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-[#44ccff] bg-opacity-20'
                    : 'bg-gray-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Chat Button */}
      <div className="flex-shrink-0 border-t border-gray-800 p-4">
        <button
          onClick={() => setMessages([{
            role: 'assistant',
            content: 'Hello! How can I help you analyze Solana transactions today?'
          }])}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 px-4 py-2 hover:bg-gray-800"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 border-t border-gray-800 p-4">
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="w-full bg-gray-800 border-gray-700 pr-10 text-white placeholder:text-gray-400"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
} 