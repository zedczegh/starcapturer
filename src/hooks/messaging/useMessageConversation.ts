
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMessaging } from '@/hooks/useMessaging';
import { ConversationPartner } from './useConversations';
import { toast } from 'sonner';

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
    unsendMessage,
    fetchConversations,
    deleteConversation
  } = useMessaging();
  
  // Handle incoming selectedUserId from navigation state
  useEffect(() => {
    const selectedUserId = location.state?.selectedUserId;
    
    if (selectedUserId && conversations.length > 0) {
      console.log("Looking for conversation with user:", selectedUserId);
      
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
  }, [location.state, conversations]);
  
  const handleSelectConversation = (conversation: ConversationPartner) => {
    setActiveConversation(conversation);
    fetchMessages(conversation.id);
  };
  
  const handleBack = () => {
    setActiveConversation(null);
  };
  
  const handleSendMessage = async (text: string, imageFile?: File | null, locationData?: any) => {
    if (!activeConversation) {
      toast.error("No active conversation selected");
      return;
    }
    
    try {
      await sendMessage(text, imageFile, locationData);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };
  
  const handleUnsendMessage = async (messageId: string): Promise<boolean> => {
    setIsProcessingAction(true);
    try {
      const result = await unsendMessage(messageId);
      return result;
    } catch (error) {
      console.error("Error unsending message:", error);
      toast.error("Failed to unsend message");
      return false;
    } finally {
      setIsProcessingAction(false);
    }
  };
  
  const handleDeleteConversation = async (partnerId: string): Promise<boolean> => {
    setIsProcessingAction(true);
    try {
      const result = await deleteConversation(partnerId);
      if (result && activeConversation?.id === partnerId) {
        handleBack();
      }
      await fetchConversations();
      return result;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
      return false;
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
    handleUnsendMessage,
    handleDeleteConversation
  };
};

export default useMessageConversation;
