
import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';
import { useLocation } from 'react-router-dom';

interface ConversationPartner {
  id: string;
  username: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export function useMessageNavigation() {
  const [activeConversation, setActiveConversation] = useState<ConversationPartner | null>(null);
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Handle incoming navigation with selectedUser parameter
  useEffect(() => {
    if (location.state?.selectedUser) {
      console.log("Received selectedUser from navigation:", location.state.selectedUser);
      
      // Set temporary conversation while waiting for full data to load
      if (!activeConversation) {
        const tempConversation: ConversationPartner = {
          id: location.state.selectedUser,
          username: "Loading...",
          avatar_url: null,
          last_message: "",
          last_message_time: new Date().toISOString(),
          unread_count: 0
        };
        
        setActiveConversation(tempConversation);
      }
    }
  }, [location.state, activeConversation]);

  // Reset conversation when switching to mobile view from desktop with active conversation
  useEffect(() => {
    // If moving from desktop to mobile with a conversation already open,
    // keep the conversation open
    // This is handled automatically by the component state
  }, [isMobile]);

  const handleSelectConversation = (conversation: ConversationPartner) => {
    setActiveConversation(conversation);
  };

  const handleBack = () => {
    setActiveConversation(null);
  };

  return {
    activeConversation,
    setActiveConversation: handleSelectConversation,
    handleBack,
    isMobile
  };
}
