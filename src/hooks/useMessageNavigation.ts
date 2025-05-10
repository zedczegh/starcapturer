
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
  const [showConversationView, setShowConversationView] = useState(false);

  const handleSelectConversation = (conversation: ConversationPartner) => {
    setActiveConversation(conversation);
    if (isMobile) {
      setShowConversationView(true);
    }
  };

  const handleBack = () => {
    if (isMobile) {
      setShowConversationView(false);
    } else {
      setActiveConversation(null);
    }
  };

  return {
    activeConversation,
    showConversationView,
    setActiveConversation: handleSelectConversation,
    handleBack,
    isMobile
  };
}
