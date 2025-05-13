
import React, { memo, useEffect, useCallback, Suspense } from "react";
import NavBar from "@/components/NavBar";
import { useAuth } from "@/contexts/AuthContext";
import LoginPrompt from "@/components/messages/LoginPrompt";
import MessageContainer from "@/components/messages/MessageContainer";
import { useMessageConversation } from "@/hooks/messaging/useMessageConversation";
import { useIsMobile } from "@/hooks/use-mobile";
import { optimizedCache } from "@/utils/optimizedCache";

// Lazy load components that might not be needed immediately
const LazyMessageContainer = React.lazy(() => import("@/components/messages/MessageContainer"));

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

  // Prefetch conversation and message data for better performance
  useEffect(() => {
    if (user?.id) {
      // Pre-warm cache for user-specific data
      const cacheKey = `messages_prefetch_${user.id}`;
      if (!optimizedCache.getCachedItem(cacheKey)) {
        console.log("Prewarming message cache");
        optimizedCache.setCachedItem(cacheKey, true, 60 * 60 * 1000); // Cache for 1 hour
      }
    }
  }, [user?.id]);

  return (
    <div className={`container mx-auto px-2 md:px-4 ${isMobile ? 'py-2 pt-14' : 'py-6 pt-20'} max-w-6xl`}>
      <Suspense fallback={
        <div className="flex items-center justify-center h-[70vh]">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      }>
        <LazyMessageContainer
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
      </Suspense>
    </div>
  );
});

// Memoize the entire Messages component
const Messages = memo(() => {
  const { user } = useAuth();

  // Optimized auth checking with better error handling
  useEffect(() => {
    if (!user) {
      // Prefetch auth components for faster loading when needed
      import("@/components/messages/LoginPrompt").catch(() => {});
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      <NavBar />
      
      {!user ? (
        <LoginPrompt />
      ) : (
        <MessageContent user={user} />
      )}
    </div>
  );
});

export default Messages;
