
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Message } from './types';
import { updateMessageStatus } from './useMessageStatus';

export function useMessageOperations(userId: string | undefined) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);

  const fetchMessages = async (partnerId: string) => {
    if (!userId || !partnerId) return;

    try {
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
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
        
        if (msg.sender_id === userId) {
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
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error(t("Failed to load messages", "加载消息失败"));
    }
  };

  const sendMessage = async (receiverId: string, message: string) => {
    if (!userId || !message.trim() || sending) return false;
    
    setSending(true);
    
    // Create temporary ID for optimistic UI update
    const tempId = `temp-${Date.now()}`;
    
    try {
      // Add the message to local state with temporary ID and 'sent' status
      const newMessage: Message = {
        id: tempId,
        sender_id: userId,
        receiver_id: receiverId,
        message: message.trim(),
        created_at: new Date().toISOString(),
        read: false,
        status: 'sent',
        sender_profile: {
          username: userId || "You",
          avatar_url: null
        }
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Send to server
      const { data, error } = await supabase
        .from('user_messages')
        .insert({
          sender_id: userId,
          receiver_id: receiverId,
          message: message.trim()
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error sending message:", error);
        setMessages(prev => updateMessageStatus(prev, tempId, 'failed'));
        toast.error(t("Failed to send message", "发送消息失败"));
        return false;
      }
      
      // Replace temp message with real one from server
      setMessages(prev => updateMessageStatus(prev, tempId, 'sent', data));
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => updateMessageStatus(prev, tempId, 'failed'));
      toast.error(t("Failed to send message", "发送消息失败"));
      return false;
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    sending,
    fetchMessages,
    sendMessage,
  };
}
