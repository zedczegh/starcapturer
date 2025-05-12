
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useMessaging } from '@/hooks/useMessaging';
import { ConversationPartner } from './useConversations';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export const useMessageConversation = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConversation, setActiveConversation] = useState<ConversationPartner | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const navigationProcessedRef = useRef(false);
  
  const {
    conversations,
    messages,
    loading,
    sending,
    fetchMessages,
    sendMessage,
    unsendMessage,
    fetchConversations,
    deleteConversation
  } = useMessaging();
  
  // Handle incoming selectedUserId from navigation state with a stable reference
  useEffect(() => {
    const selectedUserId = location.state?.selectedUserId;
    const timestamp = location.state?.timestamp;
    
    // Only process if we have a user ID and either:
    // 1. We haven't processed this navigation yet, or
    // 2. The timestamp has changed (indicating a new navigation)
    const shouldProcess = selectedUserId && 
      (!navigationProcessedRef.current || 
      (timestamp && timestamp > navigationProcessedRef.current));
    
    if (shouldProcess && conversations.length > 0) {
      console.log("Looking for conversation with user:", selectedUserId);
      navigationProcessedRef.current = timestamp || true;
      
      // Try to find existing conversation
      const existingConversation = conversations.find(
        conv => conv.id === selectedUserId
      );
      
      if (existingConversation) {
        console.log("Found existing conversation, selecting:", existingConversation);
        handleSelectConversation(existingConversation);
      } else {
        // Create a placeholder conversation if none exists
        console.log("No existing conversation found, creating placeholder for:", selectedUserId);
        const placeholderConversation: ConversationPartner = {
          id: selectedUserId,
          username: location.state?.selectedUsername || "User",
          avatar_url: null,
          last_message: "",
          last_message_time: new Date().toISOString(),
          unread_count: 0
        };
        
        handleSelectConversation(placeholderConversation);
        
        // Refresh conversations to ensure we have the latest data
        fetchConversations();
      }
    }
  }, [location.state, conversations, fetchConversations]);
  
  const handleSelectConversation = useCallback((conversation: ConversationPartner) => {
    setActiveConversation(conversation);
    fetchMessages(conversation.id);
  }, [fetchMessages]);
  
  const handleBack = useCallback(() => {
    setActiveConversation(null);
  }, []);
  
  const handleSendMessage = useCallback(async (text: string, imageFile?: File | null, locationData?: any) => {
    if (!activeConversation) {
      toast.error(t("No active conversation selected", "未选择活动对话"));
      return;
    }
    
    try {
      await sendMessage(text, imageFile, locationData);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("Failed to send message", "发送消息失败"));
    }
  }, [activeConversation, sendMessage, t]);
  
  const handleUnsendMessage = useCallback(async (messageId: string): Promise<boolean> => {
    setIsProcessingAction(true);
    try {
      const result = await unsendMessage(messageId);
      return result;
    } catch (error) {
      console.error("Error unsending message:", error);
      toast.error(t("Failed to unsend message", "撤回消息失败"));
      return false;
    } finally {
      setIsProcessingAction(false);
    }
  }, [unsendMessage, t]);
  
  const handleDeleteConversation = useCallback(async (partnerId: string): Promise<boolean> => {
    setIsProcessingAction(true);
    try {
      // Call the delete function
      const result = await deleteConversation(partnerId);
      
      if (result) {
        // Clear active conversation if it's the one being deleted
        if (activeConversation?.id === partnerId) {
          handleBack();
        }
        
        // Always fetch conversations to refresh the list after deletion
        await fetchConversations();
        
        toast.success(t("Conversation deleted", "对话已删除"));
      }
      
      return result;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error(t("Failed to delete conversation", "删除对话失败"));
      return false;
    } finally {
      setIsProcessingAction(false);
    }
  }, [activeConversation, deleteConversation, fetchConversations, handleBack, t]);
  
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
    handleUnsendMessage,
    handleDeleteConversation
  };
};

export default useMessageConversation;
