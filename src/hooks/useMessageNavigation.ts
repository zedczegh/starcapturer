
import { useState } from 'react';
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
