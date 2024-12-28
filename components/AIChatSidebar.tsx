'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Plus, Maximize2, RotateCcw, MoreHorizontal } from 'lucide-react';
import { Input } from './ui/input';
import { sendMessageToAnthropic } from '@/lib/anthropic';

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

export function AIChatSidebar({ isOpen, onClose }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! How can I help you analyze Solana transactions today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('agent');
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    setMessages([{
      role: 'assistant',
      content: 'Hello! How can I help you analyze Solana transactions today?'
    }]);
    setInput('');
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
      
      if (response.includes("[NOTE]")) {
        const noteContent = response.split("[NOTE]")[1].split("[/NOTE]")[0].trim();
        addNote(noteContent, 'assistant');
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = { 
        role: 'assistant' as const, 
        content: 'Sorry, I encountered an error processing your request. Please try again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'agent':
        return (
          <>
            <div className="flex-1 min-h-0">
              <div className="h-full overflow-y-auto p-4 space-y-4">
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`relative px-4 py-2 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-[#D85B00] text-[#FFFFFF]'
                          : 'bg-[#2D2D2D] text-[#FFFFFF]'
                      }`}
                      style={{
                        filter: 'drop-shadow(2px 4px 3px rgba(0, 0, 0, 0.5))'
                      }}
                    >
                      <div className="relative z-10">{message.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
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
          </>
        );
      case 'assistant':
        return (
          <div className="p-4">
            <div className="bg-[#2D2D2D] p-4 rounded text-[#FFFFFF]">
              <h3 className="text-lg mb-2">Assistant Information</h3>
              <p className="mb-2">This AI assistant is specialized in:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Analyzing Solana transactions</li>
                <li>Explaining blockchain concepts</li>
                <li>Providing crypto market insights</li>
                <li>Debugging Solana smart contracts</li>
              </ul>
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

  if (!isOpen) return null;

  return (
    <div 
      ref={sidebarRef}
      style={{ width: isMaximized ? '100vw' : `${width}px` }}
      className={`flex flex-col bg-[#000000] text-[#FFFFFF] border-l border-[#FFFFFF] relative ${
        isMaximized 
          ? 'fixed inset-0 h-screen' 
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

      {renderTabContent()}
    </div>
  );
} 