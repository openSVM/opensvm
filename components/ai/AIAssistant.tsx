'use client';

import { Chat } from './Chat';

interface AIAssistantProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  initialContext?: string;
}

export function AIAssistant(props: AIAssistantProps) {
  return <Chat variant="inline" {...props} />;
} 