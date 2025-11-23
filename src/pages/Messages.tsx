import React, { memo, useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t } = useLanguage();
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
    <div className={`min-h-[calc(100vh-80px)] ${isMobile ? 'pt-14' : 'pt-20'}`}>
      <div className="w-full mx-auto px-0 sm:px-4 py-3 sm:py-4 max-w-6xl">
        <div className="mb-4 sm:mb-6 px-3 sm:px-0">
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">Messages</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Connect with other astronomers and track your applications</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} mb-3 sm:mb-6 bg-cosmic-800/40 backdrop-blur-xl border-transparent sm:border-primary/10 rounded-none sm:rounded-lg mx-0`}>
            <TabsTrigger 
              value="messages" 
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:text-primary transition-all text-xs sm:text-sm py-2"
            >
              {isMobile ? t("Chat", "聊天") : t("Messages", "消息")}
            </TabsTrigger>
            <TabsTrigger 
              value="applications" 
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:text-primary transition-all text-xs sm:text-sm py-2"
            >
              {isMobile ? t("Apps", "申请") : t("My Applications", "我的申请")}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger 
                value="notifications" 
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:text-primary transition-all text-xs sm:text-sm py-2"
              >
                {isMobile ? t("Admin", "管理") : t("Admin Notifications", "管理员通知")}
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="messages" className="mt-0">
            <div className="bg-cosmic-900/40 backdrop-blur-xl rounded-none sm:rounded-lg border-l-0 border-r-0 sm:border-l sm:border-r border-y sm:border border-primary/10 overflow-hidden shadow-2xl">
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
            <div className="bg-cosmic-900/40 backdrop-blur-xl rounded-none sm:rounded-lg border-l-0 border-r-0 sm:border-l sm:border-r border-y sm:border border-primary/10 overflow-hidden shadow-2xl p-3 sm:p-6">
              <UserApplications />
            </div>
          </TabsContent>
          
          {isAdmin && (
            <TabsContent value="notifications" className="mt-0">
              <div className="bg-cosmic-900/40 backdrop-blur-xl rounded-none sm:rounded-lg border-l-0 border-r-0 sm:border-l sm:border-r border-y sm:border border-primary/10 overflow-hidden shadow-2xl p-3 sm:p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-cosmic-900 via-cosmic-950 to-cosmic-900">
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
