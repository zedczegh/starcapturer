
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
import UserApplications from "@/components/user/UserApplications";
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

  // Mark messages as viewed when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      markMessagesAsViewed();
    }
  }, [activeConversation, markMessagesAsViewed]);

  // Log conversation state for debugging
  useEffect(() => {
    if (activeConversation) {
      console.log("Active conversation in Messages:", activeConversation.id, activeConversation.username);
    }
  }, [activeConversation]);

  // Show tabs for all authenticated users
  return (
    <div className={`min-h-[calc(100vh-80px)] ${isMobile ? 'pt-16' : 'pt-20'}`}>
      <div className="container mx-auto px-2 md:px-4 py-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Messages</h1>
          <p className="text-muted-foreground">Connect with other astronomers and track your applications</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} mb-6 bg-card/50 backdrop-blur-sm`}>
            <TabsTrigger value="messages" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Messages
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              My Applications
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="notifications" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                Admin Notifications
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="messages" className="mt-0">
            <div className="bg-card/30 backdrop-blur-sm rounded-lg border border-border/50 overflow-hidden">
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
          </TabsContent>
          
          <TabsContent value="applications" className="mt-0">
            <div className="bg-card/30 backdrop-blur-sm rounded-lg border border-border/50 p-6">
              <UserApplications />
            </div>
          </TabsContent>
          
          {isAdmin && (
            <TabsContent value="notifications" className="mt-0">
              <div className="bg-card/30 backdrop-blur-sm rounded-lg border border-border/50 p-6">
                <AdminNotifications />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
});

// Memoize the entire Messages component
const Messages = memo(() => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-900 via-cosmic-950 to-purple-950/30">
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
