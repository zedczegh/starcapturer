
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMessaging } from '@/hooks/useMessaging';
import { ConversationPartner } from './useConversations';

export const useMessageConversation = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConversation, setActiveConversation] = useState<ConversationPartner | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  
  const {
    conversations,
    messages,
    loading,
    sending,
    fetchMessages,
    sendMessage,
    unsendMessage
  } = useMessaging();
  
  // Check if we should select a conversation from route state
  useEffect(() => {
    if (location.state?.selectedUser && conversations.length > 0) {
      const conversation = conversations.find(
        conv => conv.id === location.state.selectedUser
      );
      
      if (conversation) {
        handleSelectConversation(conversation);
      }
    }
  }, [location.state?.selectedUser, conversations]);
  
  const handleSelectConversation = (conversation: ConversationPartner) => {
    setActiveConversation(conversation);
    fetchMessages(conversation.id);
  };
  
  const handleBack = () => {
    setActiveConversation(null);
  };
  
  const handleSendMessage = async (text: string, imageFile?: File | null, locationData?: any) => {
    if (!activeConversation) return;
    await sendMessage(text, imageFile, locationData);
  };
  
  const handleUnsendMessage = async (messageId: string) => {
    setIsProcessingAction(true);
    try {
      const result = await unsendMessage(messageId);
      return result;
    } finally {
      setIsProcessingAction(false);
    }
  };
  
  return {
    searchQuery,
    setSearchQuery,
    activeConversation,
    messages,
    loading,
    sending,
    isProcessingAction,
    conversations,
    handleSelectConversation,
    handleBack,
    handleSendMessage,
    handleUnsendMessage
  };
};

export default useMessageConversation;
