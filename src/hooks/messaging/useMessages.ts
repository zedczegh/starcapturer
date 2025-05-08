
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { ConversationPartner } from './useConversations';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  image_url?: string | null;
  created_at: string;
  read: boolean;
  sender_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
  is_unsent?: boolean;
}

export const useMessages = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);

  const fetchMessages = useCallback(async (partnerId: string, updateConversations?: (conversationsUpdater: (prev: ConversationPartner[]) => ConversationPartner[]) => void) => {
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

      // Mark messages as read
      const unreadMessages = data?.filter(msg => !msg.read && msg.sender_id === partnerId);
      if (unreadMessages && unreadMessages.length > 0) {
        await Promise.all(unreadMessages.map(msg => 
          supabase
            .from('user_messages')
            .update({ read: true })
            .eq('id', msg.id)
        ));
        
        if (updateConversations) {
          updateConversations(prev => 
            prev.map(conv => 
              conv.id === partnerId ? { ...conv, unread_count: 0 } : conv
            )
          );
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error(t("Failed to load messages", "加载消息失败"));
    }
  }, [user, t]);
  
  return {
    messages,
    setMessages,
    fetchMessages
  };
};
