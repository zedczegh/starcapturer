import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { MessageCircle, User, Send, Search, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";

interface ConversationPartner {
  id: string;
  username: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read: boolean;
  sender_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<ConversationPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<ConversationPartner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/photo-points");
      return;
    }
    
    fetchConversations().then(() => {
      if (location.state?.selectedUser) {
        const selectedUserId = location.state.selectedUser;
        const existingConversation = conversations.find(conv => conv.id === selectedUserId);
        if (existingConversation) {
          handleSelectConversation(existingConversation);
        } else {
          supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', selectedUserId)
            .single()
            .then(({ data: profile }) => {
              if (profile) {
                const newConversation: ConversationPartner = {
                  id: selectedUserId,
                  username: profile.username,
                  avatar_url: profile.avatar_url,
                  last_message: '',
                  last_message_time: new Date().toISOString(),
                  unread_count: 0
                };
                handleSelectConversation(newConversation);
              }
            });
        }
      }
    });

    const channel = supabase
      .channel('messages_channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_messages',
          filter: `receiver_id=eq.${user.id}`
        }, 
        (payload) => {
          fetchConversations();
          if (activeConversation && 
            ((payload.new as Message).sender_id === activeConversation.id || 
             (payload.new as Message).receiver_id === activeConversation.id)) {
            fetchMessages(activeConversation.id);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('user_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) {
        toast.error("Failed to fetch messages");
        setLoading(false);
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const uniqueUserIds = new Set<string>();
      messagesData.forEach(msg => {
        if (msg.sender_id !== user.id) uniqueUserIds.add(msg.sender_id);
        if (msg.receiver_id !== user.id) uniqueUserIds.add(msg.receiver_id);
      });

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(uniqueUserIds));

      if (profilesError) {
        toast.error("Failed to fetch user profiles");
        setLoading(false);
        return;
      }

      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      const conversationsMap = new Map<string, ConversationPartner>();

      messagesData.forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationsMap.has(partnerId)) {
          const profile = profilesMap.get(partnerId);
          conversationsMap.set(partnerId, {
            id: partnerId,
            username: profile?.username || "User",
            avatar_url: profile?.avatar_url || null,
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: msg.sender_id !== user.id && !msg.read ? 1 : 0
          });
        } else {
          const existingConv = conversationsMap.get(partnerId);
          const msgTime = new Date(msg.created_at).getTime();
          const existingTime = new Date(existingConv.last_message_time).getTime();
          
          if (msgTime > existingTime) {
            existingConv.last_message = msg.message;
            existingConv.last_message_time = msg.created_at;
          }
          
          if (msg.sender_id !== user.id && !msg.read) {
            existingConv.unread_count += 1;
          }
        }
      });

      setConversations(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("An error occurred while fetching conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    if (!user || !partnerId) return;

    try {
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const senderIds = data?.map(msg => msg.sender_id) || [];
      const uniqueSenderIds = [...new Set(senderIds)];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', uniqueSenderIds);
        
      if (profilesError) throw profilesError;
      
      const messagesWithProfiles = data?.map(msg => {
        const senderProfile = profilesData?.find(profile => profile.id === msg.sender_id);
        return {
          ...msg,
          sender_profile: {
            username: senderProfile?.username || "User",
            avatar_url: senderProfile?.avatar_url
          }
        };
      });
      
      setMessages(messagesWithProfiles || []);
      
      const unreadMessages = data?.filter(msg => !msg.read && msg.sender_id === partnerId);
      
      if (unreadMessages && unreadMessages.length > 0) {
        for (const msg of unreadMessages) {
          await supabase
            .from('user_messages')
            .update({ read: true })
            .eq('id', msg.id);
        }
        
        setConversations(prev => 
          prev.map(conv => 
            conv.id === partnerId ? { ...conv, unread_count: 0 } : conv
          )
        );
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const handleSendMessage = async () => {
    if (!user || !activeConversation || !newMessage.trim() || sending) return;
    
    setSending(true);
    try {
      const { error } = await supabase
        .from('user_messages')
        .insert({
          sender_id: user.id,
          receiver_id: activeConversation.id,
          message: newMessage.trim()
        });
        
      if (error) throw error;
      
      setNewMessage("");
      fetchMessages(activeConversation.id);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = (conversation: ConversationPartner) => {
    setActiveConversation(conversation);
    fetchMessages(conversation.id);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, "h:mm a");
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      <NavBar />
      
      <div className="container mx-auto px-4 py-6 pt-20 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-4 h-[80vh]">
          <Card className={`${activeConversation ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 glassmorphism overflow-hidden flex-col`}>
            <div className="p-4 border-b border-cosmic-800">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <MessageCircle className="h-5 w-5" /> {t("Messages", "消息")}
              </h2>
              <div className="mt-3 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-cosmic-400" />
                <Input 
                  placeholder={t("Search conversations", "搜索对话")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="p-4 text-center text-cosmic-400">Loading conversations...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-cosmic-400">
                  {searchQuery ? "No conversations match your search" : "No conversations yet"}
                </div>
              ) : (
                filteredConversations.map(conversation => (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors flex items-center gap-3 
                      ${activeConversation?.id === conversation.id 
                        ? 'bg-primary/20 hover:bg-primary/30' 
                        : 'hover:bg-cosmic-800/50'
                      }`}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 border border-cosmic-700">
                        {conversation.avatar_url ? (
                          <img
                            src={conversation.avatar_url}
                            alt={conversation.username || "User"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <AvatarFallback>
                            <User className="h-5 w-5 text-cosmic-400" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {conversation.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="font-medium text-white truncate">
                          {conversation.username}
                        </p>
                        <span className="text-xs text-cosmic-400">
                          {formatMessageTime(conversation.last_message_time)}
                        </span>
                      </div>
                      <p className="text-sm text-cosmic-300 truncate">
                        {conversation.last_message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
          
          <Card className={`${!activeConversation ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 glassmorphism overflow-hidden flex flex-col`}>
            {activeConversation ? (
              <>
                <div className="p-4 border-b border-cosmic-800 flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    className="md:hidden mr-2" 
                    onClick={() => setActiveConversation(null)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10 border border-cosmic-700">
                    {activeConversation.avatar_url ? (
                      <img
                        src={activeConversation.avatar_url}
                        alt={activeConversation.username || "User"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <AvatarFallback>
                        <User className="h-5 w-5 text-cosmic-400" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-white">
                      {activeConversation.username}
                    </h3>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm text-primary"
                      onClick={() => navigate(`/profile/${activeConversation.id}`, { state: { fromMessages: true } })}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center text-cosmic-400">
                        <MessageCircle className="mx-auto h-12 w-12 mb-2 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm">Send a message to start the conversation</p>
                      </div>
                    </div>
                  ) : (
                    messages.map(message => (
                      <div 
                        key={message.id} 
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.sender_id === user?.id 
                            ? 'ml-auto bg-primary/80 text-white' 
                            : 'mr-auto bg-cosmic-800 text-cosmic-100'
                        }`}
                      >
                        {message.sender_id !== user?.id && (
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="h-6 w-6">
                              {message.sender_profile?.avatar_url ? (
                                <img 
                                  src={message.sender_profile.avatar_url} 
                                  alt={message.sender_profile.username || "User"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <AvatarFallback className="text-xs">
                                  <User className="h-3 w-3" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <span className="text-sm font-medium">
                              {message.sender_profile?.username}
                            </span>
                          </div>
                        )}
                        <p>{message.message}</p>
                        <p className="text-xs opacity-70 mt-1 text-right">
                          {formatMessageTime(message.created_at)}
                        </p>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="p-4 border-t border-cosmic-800">
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("Type a message...", "输入消息...")}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!newMessage.trim() || sending}
                      className="px-4 min-w-[80px]"
                    >
                      {sending ? (
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {t("Send", "���送")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center text-cosmic-400">
                  <MessageCircle className="mx-auto h-16 w-16 mb-3 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">
                    {t("Select a conversation", "选择一个对话")}
                  </h3>
                  <p className="max-w-md mx-auto">
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
