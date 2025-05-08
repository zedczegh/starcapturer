
import { useConversations, ConversationPartner } from './messaging/useConversations';
import { useMessages, Message } from './messaging/useMessages';
import { useMessageActions } from './messaging/useMessageActions';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  image_url?: string | null;
  created_at: string;
  read: boolean;
  sender_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
  is_unsent?: boolean;
}

export interface ConversationPartner {
  id: string;
  username: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export function useMessaging() {
  const { conversations, loading, fetchConversations } = useConversations();
  const { messages, fetchMessages, setMessages } = useMessages();
  const { sending, sendMessage, unsendMessage } = useMessageActions(fetchMessages, setMessages);

  return {
    conversations,
    messages,
    loading,
    sending,
    fetchMessages,
    sendMessage,
    unsendMessage,
  };
}
