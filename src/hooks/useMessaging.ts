
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/messaging/useConversations';
import { useMessages } from '@/hooks/messaging/useMessages';
import { useMessageActions } from '@/hooks/messaging/useMessageActions';

export const useMessaging = () => {
  const { user } = useAuth();
  
  // Use the hooks for conversations and messages
  const { conversations, loading: conversationsLoading, fetchConversations } = useConversations();
  const { messages, setMessages, fetchMessages, loading: messagesLoading } = useMessages();
  
  // Use message actions for sending and managing messages
  const { sending, sendMessage, unsendMessage } = useMessageActions(fetchMessages, setMessages);
  
  return {
    user,
    conversations,
    messages,
    loading: conversationsLoading || messagesLoading,
    sending,
    fetchMessages,
    sendMessage,
    unsendMessage
  };
};

export default useMessaging;
