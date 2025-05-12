
import { useConversations } from './messaging/useConversations';
import { useMessages } from './messaging/useMessages';
import { useMessageActions } from './messaging/useMessageActions';

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
    fetchConversations, // Add this to expose the function
  };
}
