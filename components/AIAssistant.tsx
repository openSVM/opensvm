'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Add default response for now
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'I understand your question. Let me help you with that.'
    }]);
  };

  // Add event listener in useEffect with cleanup
  useEffect(() => {
    const aiButton = document.querySelector('[data-ai-trigger]');
    if (aiButton) {
      const handleClick = () => setIsOpen(true);
      aiButton.addEventListener('click', handleClick);
      
      // Cleanup function to remove event listener
      return () => {
        aiButton.removeEventListener('click', handleClick);
      };
    }
  }, []); // Empty dependency array since we only want to run this once

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[440px] h-[600px] bg-black rounded-lg shadow-lg flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold text-white">AI Assistant</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-[#4169E1] text-white'
                  : 'bg-[#1e2126] text-white'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-[#1e2126] text-white rounded-lg pl-4 pr-20 py-3 focus:outline-none focus:ring-1 focus:ring-[#44ccff] border border-[#44ccff]/20"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#4169E1] text-white px-4 py-1.5 rounded-lg hover:bg-[#4169E1]/90 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 