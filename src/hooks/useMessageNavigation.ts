
import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

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
  
  // This prevents flickering by ensuring state stability between renders
  const handleSelectConversation = (conversation: ConversationPartner) => {
    // Only update if actually changing (prevents unnecessary re-renders)
    if (!activeConversation || activeConversation.id !== conversation.id) {
      setActiveConversation(conversation);
    }
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
