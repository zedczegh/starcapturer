import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import NavBar from "@/components/NavBar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { MessageCircle } from "lucide-react";
import { useMessaging } from "@/hooks/useMessaging";
import ConversationList from "@/components/messages/ConversationList";
import MessageList from "@/components/messages/MessageList";
import MessageInput from "@/components/messages/MessageInput";
import { fetchUserProfile } from "@/utils/profileUtils";
import { Button } from "@/components/ui/button";

interface ConversationPartner {
  id: string;
  username: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

const Messages = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeConversation, setActiveConversation] = useState<ConversationPartner | null>(null);
  
  const {
    conversations,
    messages,
    loading,
    sending,
    fetchMessages,
    sendMessage,
  } = useMessaging();

  // Handle incoming user from navigation
  useEffect(() => {
    const initializeFromNavigation = async () => {
      if (!user || !location.state?.selectedUserId) return;
      
      const selectedUserId = location.state.selectedUserId;
      const selectedUsername = location.state.selectedUsername;
      
      // Look for the conversation in existing conversations
      const existingConversation = conversations.find(c => c.id === selectedUserId);
      
      if (existingConversation) {
        // If the conversation already exists, select it
        setActiveConversation(existingConversation);
        fetchMessages(existingConversation.id);
      } else if (selectedUserId) {
        // If it's a new conversation, create a placeholder and fetch profile data
        try {
          // First try to use the passed username if available
          let username = selectedUsername || null;
          let avatar_url = null;
          
          // If no username was provided in navigation state, fetch the profile
          if (!username) {
            const profileData = await fetchUserProfile(selectedUserId);
            if (profileData) {
              username = profileData.username || "User";
              avatar_url = profileData.avatar_url;
            }
          }
          
          // Create a new conversation object
          const newConversation: ConversationPartner = {
            id: selectedUserId,
            username: username || "User",
            avatar_url: avatar_url,
            last_message: "",
            last_message_time: new Date().toISOString(),
            unread_count: 0
          };
          
          setActiveConversation(newConversation);
          fetchMessages(selectedUserId);
        } catch (error) {
          console.error("Error fetching profile for new conversation:", error);
        }
      }
      
      // Clear the location state to prevent re-initialization
      window.history.replaceState({}, document.title);
    };
    
    if (user) {
      initializeFromNavigation();
    }
  }, [user, location.state, conversations]);

  const handleSelectConversation = (conversation: ConversationPartner) => {
    setActiveConversation(conversation);
    fetchMessages(conversation.id);
  };

  const handleBack = () => {
    setActiveConversation(null);
  };

  const handleSendMessage = async (message: string) => {
    if (!activeConversation) return;
    const success = await sendMessage(activeConversation.id, message);
    if (success) {
      fetchMessages(activeConversation.id);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
        <NavBar />
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <Card className="p-8 max-w-md w-full glassmorphism text-center">
            <MessageCircle className="mx-auto h-16 w-16 mb-4 text-primary/40" />
            <h2 className="text-xl font-semibold text-white mb-4">
              {t("Sign in to view messages", "请登录以查看消息")}
            </h2>
            <p className="text-cosmic-300 mb-6">
              {t(
                "You need to be signed in to access your messages and conversations.", 
                "您需要登录才能访问您的消息和对话。"
              )}
            </p>
            <Button 
              onClick={() => navigate('/photo-points')} 
              className="w-full"
            >
              {t("Back to Photo Points", "返回照片点位")}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      <NavBar />
      
      <div className="container mx-auto px-4 py-6 pt-20 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-4 h-[80vh]">
          <Card className={`${activeConversation ? 'hidden md:flex' : 'flex'} 
            w-full md:w-1/3 glassmorphism overflow-hidden flex-col
            border border-cosmic-800/30 shadow-xl backdrop-blur-lg`}
          >
            <ConversationList 
              conversations={conversations}
              loading={loading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeConversation={activeConversation}
              onSelectConversation={handleSelectConversation}
            />
          </Card>
          
          <Card className={`${!activeConversation ? 'hidden md:flex' : 'flex'} 
            w-full md:w-2/3 glassmorphism overflow-hidden flex flex-col
            border border-cosmic-800/30 shadow-xl backdrop-blur-lg`}
          >
            {activeConversation ? (
              <>
                <MessageList 
                  messages={messages}
                  currentUserId={user.id}
                  activeConversation={activeConversation}
                  onBack={handleBack}
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
        </div>
      </div>
    </div>
  );
};

export default Messages;
