
import React from "react";
import NavBar from "@/components/NavBar";
import { useAuth } from "@/contexts/AuthContext";
import LoginPrompt from "@/components/messages/LoginPrompt";
import MessageContainer from "@/components/messages/MessageContainer";
import { useMessageNavigation } from "@/hooks/useMessageNavigation";

const Messages = () => {
  const { user } = useAuth();
  const {
    activeConversation,
    showConversationView,
    handleBack,
    isMobile
  } = useMessageNavigation();

  // Get conversation data from useMessageConversation hook
  const {
    searchQuery,
    setSearchQuery,
    messages,
    loading,
    sending,
    isProcessingAction,
    conversations,
    handleSelectConversation,
    handleSendMessage,
    handleUnsendMessage
  } = useMessageConversation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      <NavBar />
      
      {!user ? (
        <LoginPrompt />
      ) : (
        <div className="container mx-auto px-4 py-6 pt-20 max-w-6xl">
          <MessageContainer
            activeConversation={activeConversation}
            showConversationView={showConversationView}
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
            isMobile={isMobile}
          />
        </div>
      )}
    </div>
  );
};

export default Messages;
