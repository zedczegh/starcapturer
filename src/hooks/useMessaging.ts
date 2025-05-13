
import { useConversations } from './messaging/useConversations';
import { useMessages } from './messaging/useMessages';
import { useMessageActions } from './messaging/useMessageActions';

export function useMessaging() {
  const { conversations, loading: convsLoading, fetchConversations } = useConversations();
  const { messages, loading: msgsLoading, fetchMessages, setMessages } = useMessages();
  const { 
    sending, 
    sendMessage: sendMessageAction, 
    unsendMessage, 
    deleteConversation
  } = useMessageActions(fetchMessages, fetchConversations, setMessages);

  // Wrap sendMessage to ensure it uses partnerId correctly
  const sendMessage = async (
    partnerId: string,
    text: string,
    imageFile?: File | null,
    locationData?: any
  ) => {
    await sendMessageAction(partnerId, text, imageFile, locationData);
    
    // Immediately fetch messages after sending to ensure UI is updated
    fetchMessages(partnerId);
    
    // Also refresh the conversations list
    fetchConversations(true);
  };

  return {
    conversations,
    messages,
    loading: convsLoading || msgsLoading,
    sending,
    fetchMessages,
    sendMessage,
    unsendMessage,
    fetchConversations,
    deleteConversation,
  };
}
