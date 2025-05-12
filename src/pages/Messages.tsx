
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import NavBar from "@/components/NavBar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { MessageCircle } from "lucide-react";
import { useMessaging } from "@/hooks/useMessaging";
import ConversationList from "@/components/messages/ConversationList";
import MessageList from "@/components/messages/MessageList";
import MessageInput from "@/components/messages/MessageInput";
import { useMessageNavigation } from "@/hooks/useMessageNavigation";
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";

const Messages = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    activeConversation,
    setActiveConversation,
    handleBack,
    isMobile
  } = useMessageNavigation();
  
  const {
    conversations,
    messages,
    loading,
    sending,
    fetchMessages,
    sendMessage,
  } = useMessaging();

  // Listen for new conversation parameter in URL when directed from profile
  useEffect(() => {
    if (location.state?.conversationId && user) {
      const conversation = conversations.find(c => c.id === location.state.conversationId);
      if (conversation) {
        setActiveConversation(conversation);
      }
    }
  }, [location.state, conversations, user, setActiveConversation]);

  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    fetchMessages(conversation.id);
  };

  const handleSendMessage = async (message) => {
    if (!activeConversation) return;
    
    const success = await sendMessage(activeConversation.id, message);
    if (success) {
      fetchMessages(activeConversation.id);
    } else {
      toast({
        title: t("Message not sent", "消息发送失败"),
        description: t("Please try again", "请重试"),
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">
            {t("Please sign in to view your messages", "请登录以查看您的消息")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
        <NavBar />
        
        <div className="container mx-auto px-4 py-6 pt-20 max-w-6xl">
          <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-8rem)]">
            <AnimatePresence mode="wait" initial={false}>
              {(!activeConversation || !isMobile) && (
                <motion.div 
                  key="conversation-list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="w-full md:w-1/3 flex-shrink-0"
                >
                  <Card className="glassmorphism overflow-hidden flex flex-col h-full
                      border border-cosmic-800/30 shadow-xl backdrop-blur-lg">
                    <ConversationList 
                      conversations={conversations}
                      loading={loading}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      activeConversation={activeConversation}
                      onSelectConversation={handleSelectConversation}
                      isMobile={isMobile}
                    />
                  </Card>
                </motion.div>
              )}
              
              {(activeConversation || !isMobile) && (
                <motion.div 
                  key="message-list"
                  initial={isMobile ? { opacity: 0, x: 20 } : { opacity: 0 }}
                  animate={isMobile ? { opacity: 1, x: 0 } : { opacity: 1 }}
                  exit={isMobile ? { opacity: 0, x: 20 } : { opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full md:w-2/3 flex-grow"
                >
                  <Card className="glassmorphism overflow-hidden flex flex-col h-full
                      border border-cosmic-800/30 shadow-xl backdrop-blur-lg">
                    {activeConversation ? (
                      <>
                        <MessageList 
                          messages={messages}
                          currentUserId={user.id}
                          activeConversation={activeConversation}
                          onBack={handleBack}
                          isMobile={isMobile}
                        />
                        <MessageInput 
                          onSend={handleSendMessage}
                          sending={sending}
                        />
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center text-cosmic-400 space-y-4">
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <MessageCircle className="mx-auto h-20 w-20 mb-6 opacity-20" />
                          </motion.div>
                          <h3 className="text-xl font-medium text-white mb-2">
                            {t("Select a conversation", "选择一个对话")}
                          </h3>
                          <p className="max-w-md mx-auto text-cosmic-300">
                            {t(
                              "Choose a conversation from the list or start a new one by going to a user's profile", 
                              "从列表中选择一个对话，或通过访问用户资料开始新的对话"
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Messages;
