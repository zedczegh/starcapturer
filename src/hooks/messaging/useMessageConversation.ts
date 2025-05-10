
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMessaging } from '@/hooks/useMessaging';
import { ConversationPartner } from './useConversations';
import { useMessageNavigation } from '@/hooks/useMessageNavigation';

export const useMessageConversation = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  
  // Use the centralized message navigation hook instead of local state
  const { activeConversation, setActiveConversation: handleSelectConversation, handleBack } = useMessageNavigation();
  
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
  }, [location.state?.selectedUser, conversations, handleSelectConversation]);
  
  // Fetch messages when conversation is selected
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    }
  }, [activeConversation, fetchMessages]);
  
  const handleSendMessage = async (text: string, imageFile?: File | null, locationData?: any) => {
    if (!activeConversation) return;
    await sendMessage(text, imageFile, locationData);
  };
  
  const handleUnsendMessage = async (messageId: string): Promise<boolean> => {
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
