import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useMessaging } from '@/hooks/useMessaging';
import { ConversationPartner } from './useConversations';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export const useMessageConversation = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConversation, setActiveConversation] = useState<ConversationPartner | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [localConversations, setLocalConversations] = useState<ConversationPartner[]>([]);
  const navigationProcessedRef = useRef<boolean | number>(false);
  const prevSelectedUserIdRef = useRef<string | null>(null);
  const initializationDoneRef = useRef(false);
  
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

  // Keep local state in sync with conversations from useMessaging
  useEffect(() => {
    console.log("Updating local conversations state:", conversations.length);
    setLocalConversations(conversations);
  }, [conversations]);
  
  // Initialize the component and handle navigation state
  useEffect(() => {
    if (initializationDoneRef.current) return;
    
    // Mark initialization as done to avoid unnecessary fetches
    initializationDoneRef.current = true;
    
    // Immediately fetch conversations on mount
    fetchConversations();
  }, [fetchConversations]);
  
  // Handle incoming selectedUserId from navigation state
  useEffect(() => {
    const selectedUserId = location.state?.selectedUserId;
    const timestamp = location.state?.timestamp || Date.now();
    
    // Skip if no selected user or it's the same as the previous one
    if (!selectedUserId || selectedUserId === prevSelectedUserIdRef.current) return;
    
    // Update the ref to prevent duplicate processing
    prevSelectedUserIdRef.current = selectedUserId;
    
    // Only process if we have a user ID and either:
    // 1. We haven't processed this navigation yet, or
    // 2. The timestamp has changed (indicating a new navigation)
    const shouldProcess = selectedUserId && 
      (!navigationProcessedRef.current || 
      (timestamp && timestamp > (navigationProcessedRef.current as number)));
    
    if (shouldProcess) {
      console.log("Looking for conversation with user:", selectedUserId);
      navigationProcessedRef.current = timestamp;
      
      // Try to find existing conversation
      const existingConversation = localConversations.find(
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
      }
    }
  }, [location.state, localConversations, fetchConversations]);
  
  const handleSelectConversation = useCallback((conversation: ConversationPartner) => {
    setActiveConversation(conversation);
    fetchMessages(conversation.id);
  }, [fetchMessages]);
  
  const handleBack = useCallback(() => {
    setActiveConversation(null);
  }, []);
  
  const handleSendMessage = useCallback(async (text: string, imageFile?: File | null, locationData?: any) => {
    if (!activeConversation) {
      toast.error(
        t("No active conversation selected", "未选择活动对话"),
        t("Please select a conversation first", "请先选择对话")
      );
      return;
    }
    
    try {
      // Send immediately without processing state for faster UX
      await sendMessage(activeConversation.id, text, imageFile, locationData);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(
        t("Failed to send message", "发送消息失败"),
        t("Please try again later", "请稍后重试")
      );
    }
  }, [activeConversation, sendMessage, t, toast]);
  
  const handleUnsendMessage = useCallback(async (messageId: string): Promise<boolean> => {
    setIsProcessingAction(true);
    try {
      const result = await unsendMessage(messageId);
      return result;
    } catch (error) {
      console.error("Error unsending message:", error);
      toast.error(
        t("Failed to unsend message", "撤回消息失败"),
        t("Please try again later", "请稍后重试")
      );
      return false;
    } finally {
      setIsProcessingAction(false);
    }
  }, [unsendMessage, t, toast]);
  
  const handleDeleteConversation = useCallback(async (partnerId: string): Promise<boolean> => {
    setIsProcessingAction(true);
    try {
      console.log("Attempting to delete conversation with partner:", partnerId);
      
      // Call the delete function
      const result = await deleteConversation(partnerId);
      
      if (result) {
        // Clear active conversation if it's the one being deleted
        if (activeConversation?.id === partnerId) {
          handleBack();
        }
        
        // Remove the conversation from the local state immediately
        setLocalConversations(prev => prev.filter(conv => conv.id !== partnerId));
        
        toast.success(
          t("Conversation deleted", "对话已删除"),
          t("The conversation has been removed", "对话已被删除")
        );
      }
      
      return result;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error(
        t("Failed to delete conversation", "删除对话失败"),
        t("Please try again later", "请稍后重试")
      );
      return false;
    } finally {
      setIsProcessingAction(false);
    }
  }, [activeConversation, deleteConversation, handleBack, t, toast]);
  
  return {
    searchQuery,
    setSearchQuery,
    activeConversation,
    messages,
    loading,
    sending,
    isProcessingAction,
    conversations: localConversations, // Use local conversations state
    handleSelectConversation,
    handleBack,
    handleSendMessage,
    handleUnsendMessage,
    handleDeleteConversation
  };
};

export default useMessageConversation;
