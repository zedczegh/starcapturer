
import { useState, useCallback, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export interface ConversationPartner {
  id: string;
  username: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export const useConversations = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<ConversationPartner[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchConversations = useCallback(async () => {
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
  }, [user, t]);
  
  // Set up real-time subscription for new messages
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
  }, [user, fetchConversations]);
  
  return {
    conversations,
    loading,
    fetchConversations
  };
};
