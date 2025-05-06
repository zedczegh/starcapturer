
import { Message } from '@/hooks/messaging/types';

export function updateMessageStatus(messages: Message[], tempId: string, status: 'sent' | 'failed' | 'read', newData?: any): Message[] {
  return messages.map(msg => 
    msg.id === tempId ? { 
      ...(newData || msg), 
      status, 
      sender_profile: msg.sender_profile 
    } : msg
  );
}
