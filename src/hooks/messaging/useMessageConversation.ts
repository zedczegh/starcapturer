
import { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserProfile } from "@/utils/profileUtils";
import { useMessaging } from "@/hooks/useMessaging";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { ConversationPartner } from "./useConversations";

export const useMessageConversation = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
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
  } = useMessaging();

  // Handle incoming user from navigation
  useEffect(() => {
    const initializeFromNavigation = async () => {
      if (!user || !location.state?.selectedUserId) return;
      
      const selectedUserId = location.state.selectedUserId;
      const selectedUsername = location.state.selectedUsername;
      
      // Look for the conversation in existing conversations
      const existingConversation = conversations.find(c => c.id === selectedUserId);
      
      if (existingConversation) {
        // If the conversation already exists, select it
        setActiveConversation(existingConversation);
        fetchMessages(existingConversation.id);
      } else if (selectedUserId) {
        // If it's a new conversation, create a placeholder and fetch profile data
        try {
          // First try to use the passed username if available
          let username = selectedUsername || null;
          let avatar_url = null;
          
          // If no username was provided in navigation state, fetch the profile
          if (!username) {
            const profileData = await fetchUserProfile(selectedUserId);
            if (profileData) {
              username = profileData.username || "User";
              avatar_url = profileData.avatar_url;
            }
          }
          
          // Create a new conversation object
          const newConversation: ConversationPartner = {
            id: selectedUserId,
            username: username || "User",
            avatar_url: avatar_url,
            last_message: "",
            last_message_time: new Date().toISOString(),
            unread_count: 0
          };
          
          setActiveConversation(newConversation);
          fetchMessages(selectedUserId);
        } catch (error) {
          console.error("Error fetching profile for new conversation:", error);
        }
      }
      
      // Clear the location state to prevent re-initialization
      window.history.replaceState({}, document.title);
    };
    
    if (user) {
      initializeFromNavigation();
    }
  }, [user, location.state, conversations, fetchMessages]);

  const handleSelectConversation = (conversation: ConversationPartner) => {
    setActiveConversation(conversation);
    fetchMessages(conversation.id);
  };

  const handleBack = () => {
    setActiveConversation(null);
  };

  const handleSendMessage = async (message: string, imageFile?: File | null) => {
    if (!activeConversation || isProcessingAction) return;
    
    try {
      setIsProcessingAction(true);
      const success = await sendMessage(activeConversation.id, message, imageFile);
      
      if (success) {
        // Re-fetch messages after successful send
        await fetchMessages(activeConversation.id);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("Failed to send message", "发送消息失败"));
    } finally {
      setIsProcessingAction(false);
    }
  };
  
  const handleUnsendMessage = async (messageId: string) => {
    if (!activeConversation || isProcessingAction) return false;
    
    try {
      setIsProcessingAction(true);
      const success = await unsendMessage(messageId);
      
      setTimeout(() => {
        setIsProcessingAction(false);
      }, 300);
      
      return success;
    } catch (error) {
      console.error("Error unsending message:", error);
      toast.error(t("Failed to unsend message", "撤回消息失败"));
      setIsProcessingAction(false);
      return false;
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
