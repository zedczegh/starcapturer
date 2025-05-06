
import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageStatusType = 'sent' | 'read' | 'error';

interface MessageStatusProps {
  status: MessageStatusType;
  className?: string;
}

const MessageStatus: React.FC<MessageStatusProps> = ({ status, className }) => {
  if (status === 'sent') {
    return (
      <span className={cn("inline-flex text-cosmic-400", className)}>
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  } else if (status === 'read') {
    return (
      <span className={cn("inline-flex text-emerald-500", className)}>
        <Check className="h-3.5 w-3.5" />
        <Check className="h-3.5 w-3.5 -ml-1.5" />
      </span>
    );
  } else if (status === 'error') {
    return (
      <span className={cn("inline-flex text-red-500", className)}>
        <X className="h-3.5 w-3.5" />
      </span>
    );
  }

  return null;
};

export default MessageStatus;
