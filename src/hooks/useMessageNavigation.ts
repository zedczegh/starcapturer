
import { useState } from 'react';
import { useIsMobile } from './use-mobile';
import { ConversationPartner } from './messaging/types';

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
