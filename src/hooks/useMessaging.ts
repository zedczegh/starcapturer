
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

  // Optimized sendMessage with optimistic updates
  const sendMessage = async (
    partnerId: string,
    text: string,
    imageFile?: File | null,
    locationData?: any
  ) => {
    try {
      // Optimistic update - add temporary message immediately
      const tempMessage = {
        id: `temp-${Date.now()}`,
        sender_id: messages.length > 0 ? messages[0].sender_id : '',
        receiver_id: partnerId,
        message: text,
        image_url: null,
        created_at: new Date().toISOString(),
        read: false,
        sending: true
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      // Send the actual message
      await sendMessageAction(partnerId, text, imageFile, locationData);
      
      // Fetch fresh messages and conversations in parallel
      await Promise.all([
        fetchMessages(partnerId),
        fetchConversations(true)
      ]);
    } catch (error) {
      // Remove temp message on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
      throw error;
    }
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
