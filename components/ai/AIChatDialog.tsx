'use client';

import { Chat } from './Chat';

interface AIChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: string;
}

export function AIChatDialog(props: AIChatDialogProps) {
  return <Chat variant="dialog" {...props} />;
} 