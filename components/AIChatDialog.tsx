import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: string;
}

export function AIChatDialog({ isOpen, onClose, initialContext }: AIChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([
    initialContext ? { role: 'assistant', content: initialContext } : { role: 'assistant', content: 'Hello! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // TODO: Implement actual AI response logic
    const assistantMessage = { role: 'assistant' as const, content: 'I understand your question. Let me help you with that.' };
    setMessages(prev => [...prev, assistantMessage]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]">
      <div className="w-full max-w-2xl bg-[#000000]">
        <div className="flex h-[40px] bg-[#000000]">
          <div className="flex items-center px-4 border-b border-[#FFFFFF] h-full">
            <h2 className="text-base text-[#FFFFFF]">AGENT</h2>
          </div>
          <div className="flex items-center px-4 h-full">
            <h2 className="text-base text-[#FFFFFF]">ASSISTANT</h2>
          </div>
          <div className="flex items-center px-4 h-full">
            <h2 className="text-base text-[#FFFFFF]">NOTES</h2>
          </div>
          <div className="ml-auto flex items-center gap-4 px-4">
            <button className="text-[#FFFFFF]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 2L14 14M2 14L14 2" stroke="white" strokeWidth="1.5"/>
              </svg>
            </button>
            <button className="text-[#FFFFFF]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2V14M2 8H14" stroke="white" strokeWidth="1.5"/>
              </svg>
            </button>
            <button className="text-[#FFFFFF]">⋯</button>
            <button
              onClick={onClose}
              className="text-[#FFFFFF]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="h-[400px] overflow-y-auto py-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-4 py-3 mx-4 max-w-[80%] bg-[#000000] text-[#FFFFFF] border border-[#FFFFFF]`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 space-y-4">
          <button className="w-full py-3 border border-[#FFFFFF] text-[#FFFFFF] text-sm">
            + New Chat
          </button>
          <div className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="w-full bg-[#000000] text-[#FFFFFF] px-4 py-3 border border-[#FFFFFF] focus:outline-none placeholder-[#FFFFFF]"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFFFFF]"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2L2 14M14 2L2 2M14 2L14 14" stroke="white" strokeWidth="1.5"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 