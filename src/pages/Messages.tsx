
import React, { memo, useEffect, useCallback } from "react";
import NavBar from "@/components/NavBar";
import { useAuth } from "@/contexts/AuthContext";
import LoginPrompt from "@/components/messages/LoginPrompt";
import MessageContainer from "@/components/messages/MessageContainer";
import { useMessageConversation } from "@/hooks/messaging/useMessageConversation";
import { useIsMobile } from "@/hooks/use-mobile";

// Memoize the MessageContent component to prevent unnecessary re-renders
const MessageContent = memo(({ user }: { user: any }) => {
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
    handleUnsendMessage,
    handleDeleteConversation
  } = useMessageConversation();

  return (
    <div className={`container mx-auto px-2 md:px-4 ${isMobile ? 'py-2 pt-16 pb-0' : 'py-6 pt-20'} max-w-6xl`}>
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
        onDeleteConversation={handleDeleteConversation}
        sending={sending}
        isProcessingAction={isProcessingAction}
        currentUserId={user.id}
      />
    </div>
  );
});

// Memoize the entire Messages component
const Messages = memo(() => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { activeConversation } = useMessageConversation();

  // Hide navbar on mobile when a conversation is active
  const showNavbar = !(isMobile && activeConversation);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      {showNavbar && <NavBar />}
      
      {!user ? (
        <LoginPrompt />
      ) : (
        <MessageContent user={user} />
      )}
    </div>
  );
});

export default Messages;
