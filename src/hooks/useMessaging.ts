
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read: boolean;
  status?: 'sent' | 'failed' | 'read';
  sender_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

interface ConversationPartner {
  id: string;
  username: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export function useMessaging() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<ConversationPartner[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('user_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

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

      if (profilesError) throw profilesError;

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
      toast.error(t("Failed to load conversations", "加载对话失败"));
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
      
      // Transform messages to include status indicators
      const messagesWithProfiles = data?.map(msg => {
        const senderProfile = profilesData?.find(profile => profile.id === msg.sender_id);
        let messageStatus: 'sent' | 'read' | undefined = undefined;
        
        if (msg.sender_id === user.id) {
          messageStatus = msg.read ? 'read' : 'sent';
        }
                       
        return {
          ...msg,
          status: messageStatus,
          sender_profile: {
            username: senderProfile?.username || "User",
            avatar_url: senderProfile?.avatar_url
          }
        } as Message;  
      });
      
      setMessages(messagesWithProfiles || []);

      // Mark messages as read
      const unreadMessages = data?.filter(msg => !msg.read && msg.sender_id === partnerId);
      if (unreadMessages && unreadMessages.length > 0) {
        await Promise.all(unreadMessages.map(msg => 
          supabase
            .from('user_messages')
            .update({ read: true })
            .eq('id', msg.id)
        ));
        
        setConversations(prev => 
          prev.map(conv => 
            conv.id === partnerId ? { ...conv, unread_count: 0 } : conv
          )
        );
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error(t("Failed to load messages", "加载消息失败"));
    }
  };

  const sendMessage = async (receiverId: string, message: string) => {
    if (!user || !message.trim() || sending) return false;
    
    setSending(true);
    try {
      // First, add the message to the local state with a temporary ID and 'sent' status
      const tempId = `temp-${Date.now()}`;
      const newMessage: Message = {
        id: tempId,
        sender_id: user.id,
        receiver_id: receiverId,
        message: message.trim(),
        created_at: new Date().toISOString(),
        read: false,
        status: 'sent',
        sender_profile: {
          username: user.email?.split('@')[0] || "You",
          avatar_url: null // This will be updated when fetched
        }
      };
      
      // Add message to UI immediately
      setMessages(prev => [...prev, newMessage]);
      
      // Now try to send to the server
      const { data, error } = await supabase
        .from('user_messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          message: message.trim()
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error sending message:", error);
        // Update the message status to 'failed'
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? { ...msg, status: 'failed' as const } : msg
          )
        );
        toast.error(t("Failed to send message", "发送消息失败"));
        return false;
      }
      
      // Replace the temporary message with the real one from the server
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? {
            ...data,
            status: 'sent' as const,
            sender_profile: msg.sender_profile
          } : msg
        )
      );
      
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      // Update the message status to 'failed'
      setMessages(prev => 
        prev.map(msg => 
          msg.id === `temp-${Date.now()}` ? { ...msg, status: 'failed' as const } : msg
        )
      );
      toast.error(t("Failed to send message", "发送消息失败"));
      return false;
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    fetchConversations();

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
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    conversations,
    messages,
    loading,
    sending,
    fetchMessages,
    sendMessage,
  };
}
