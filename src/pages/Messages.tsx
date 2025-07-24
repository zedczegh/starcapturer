
import React, { memo, useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { useAuth } from "@/contexts/AuthContext";
import LoginPrompt from "@/components/messages/LoginPrompt";
import MessageContainer from "@/components/messages/MessageContainer";
import { useMessageConversation } from "@/hooks/messaging/useMessageConversation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/useNotifications";
import { useUserRole } from "@/hooks/useUserRole";
import { useLocation } from "react-router-dom";
import AdminNotifications from "@/components/admin/AdminNotifications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Memoize the MessageContent component to prevent unnecessary re-renders
const MessageContent = memo(({ user }: { user: any }) => {
  const isMobile = useIsMobile();
  const { markMessagesAsViewed } = useNotifications();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('messages');
  
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

  // Check if we should show admin notifications tab
  useEffect(() => {
    if (location.state?.showAdminNotifications && isAdmin) {
      setActiveTab('notifications');
    }
  }, [location.state, isAdmin]);

  // Mark messages as viewed when the component mounts
  useEffect(() => {
    markMessagesAsViewed();
  }, [markMessagesAsViewed]);

  // Log conversation state for debugging
  useEffect(() => {
    if (activeConversation) {
      console.log("Active conversation in Messages:", activeConversation.id, activeConversation.username);
    }
  }, [activeConversation]);

  if (isAdmin) {
    return (
      <div className={`container mx-auto px-2 md:px-4 ${isMobile ? 'py-2 pt-16' : 'py-6 pt-20'} max-w-6xl`}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="notifications">Admin Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="messages" className="mt-0">
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
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-0">
            <AdminNotifications />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-2 md:px-4 ${isMobile ? 'py-2 pt-16' : 'py-6 pt-20'} max-w-6xl`}>
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
