
import React from "react";
import NavBar from "@/components/NavBar";
import { useAuth } from "@/contexts/AuthContext";
import LoginPrompt from "@/components/messages/LoginPrompt";
import MessageContainer from "@/components/messages/MessageContainer";
import { useMessageConversation } from "@/hooks/messaging/useMessageConversation";
import { useIsMobile } from "@/hooks/use-mobile";

const Messages = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const {
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
  } = useMessageConversation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      <NavBar />
      
      {!user ? (
        <LoginPrompt />
      ) : (
        <div className={`container mx-auto ${isMobile ? 'px-2' : 'px-4'} py-6 pt-20 max-w-6xl`}>
          <MessageContainer
            activeConversation={activeConversation}
            conversations={conversations}
            loading={loading}
            messages={messages}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectConversation={handleSelectConversation}
            onBack={handleBack}
            onSendMessage={handleSendMessage}
            onUnsendMessage={handleUnsendMessage}
            sending={sending}
            isProcessingAction={isProcessingAction}
            currentUserId={user.id}
          />
        </div>
      )}
    </div>
  );
};

export default Messages;
