
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export type MessageStatusType = 'sent' | 'read' | 'error';

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
  status?: MessageStatusType;
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
  const [unreadCount, setUnreadCount] = useState(0);

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
        setUnreadCount(0);
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
      let totalUnread = 0;

      messagesData.forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationsMap.has(partnerId)) {
          const profile = profilesMap.get(partnerId);
          const unreadCount = msg.sender_id !== user.id && !msg.read ? 1 : 0;
          totalUnread += unreadCount;
          
          conversationsMap.set(partnerId, {
            id: partnerId,
            username: profile?.username || "User",
            avatar_url: profile?.avatar_url || null,
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: unreadCount
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
            totalUnread += 1;
          }
        }
      });

      setUnreadCount(totalUnread);
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
      
      const messagesWithProfiles = data?.map(msg => {
        const senderProfile = profilesData?.find(profile => profile.id === msg.sender_id);
        // Set appropriate status for messages
        const status: MessageStatusType = 
          msg.sender_id === user.id ? (msg.read ? 'read' : 'sent') : 'sent';
          
        return {
          ...msg,
          status,
          sender_profile: {
            username: senderProfile?.username || "User",
            avatar_url: senderProfile?.avatar_url
          }
        };
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
        
        // Update total unread count
        setUnreadCount(prev => Math.max(0, prev - unreadMessages.length));
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
      const { data, error } = await supabase
        .from('user_messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          message: message.trim()
        })
        .select();
        
      if (error) throw error;
      
      // Add the new message to the messages state with optimistic update
      if (data && data.length > 0) {
        const newMessage = {
          ...data[0],
          status: 'sent' as MessageStatusType,
          sender_profile: {
            username: user.email || "User",
            avatar_url: null
          }
        };
        
        setMessages(prev => [...prev, newMessage]);
      }
      
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("Failed to send message", "发送消息失败"));
      
      // Add failed message to the list with error status
      const failedMessage = {
        id: `temp-${Date.now()}`,
        sender_id: user.id,
        receiver_id: receiverId,
        message: message.trim(),
        created_at: new Date().toISOString(),
        read: false,
        status: 'error' as MessageStatusType,
        sender_profile: {
          username: user.email || "User",
          avatar_url: null
        }
      };
      
      setMessages(prev => [...prev, failedMessage]);
      
      return false;
    } finally {
      setSending(false);
    }
  };

  // New function to send booking notification message
  const sendBookingNotification = async (creatorId: string, spotName: string, timeSlot: string) => {
    if (!user) return false;
    
    try {
      const message = t(
        `I've made a booking request for "${spotName}" at ${timeSlot}. Please review it when you have a chance.`,
        `我已经为"${spotName}"在 ${timeSlot} 提出了预订请求。请您有空时查看。`
      );
      
      return await sendMessage(creatorId, message);
    } catch (error) {
      console.error("Error sending booking notification:", error);
      return false;
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
        () => {
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
    unreadCount,
    fetchMessages,
    sendMessage,
    sendBookingNotification,
  };
}
