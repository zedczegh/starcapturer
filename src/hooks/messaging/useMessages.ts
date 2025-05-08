
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export const useMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const fetchMessages = useCallback(async (conversationPartnerId: string) => {
    if (!user || !conversationPartnerId) {
      console.log("Missing user or conversation partner ID");
      return;
    }
    
    setLoading(true);
    console.log("Fetching messages between", user.id, "and", conversationPartnerId);
    
    try {
      // Fetch actual messages from the database
      const { data: messagesData, error } = await supabase
        .from('user_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conversationPartnerId}),and(sender_id.eq.${conversationPartnerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      console.log("Fetched messages:", messagesData);
      
      // Transform the messages to the expected format
      const formattedMessages = messagesData.map(msg => {
        // Parse location from message JSON if it exists
        let locationData = null;
        if (msg.message && msg.message.startsWith('{"type":"location"')) {
          try {
            const parsedData = JSON.parse(msg.message);
            if (parsedData.type === 'location' && parsedData.data) {
              locationData = parsedData.data;
            }
          } catch (e) {
            console.error("Failed to parse location data:", e);
          }
        }
        
        return {
          id: msg.id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          text: locationData ? '' : msg.message, // If it's a location message, set text to empty
          created_at: msg.created_at,
          image_url: msg.image_url,
          location: locationData, // Use parsed location data
          read: msg.read // Include read status for checkmark functionality
        };
      });
      
      setMessages(formattedMessages);
      
      // Mark messages as read
      if (messagesData && messagesData.length > 0) {
        const messagesToUpdate = messagesData
          .filter(msg => msg.receiver_id === user.id && !msg.read)
          .map(msg => msg.id);
        
        if (messagesToUpdate.length > 0) {
          await supabase
            .from('user_messages')
            .update({ read: true })
            .in('id', messagesToUpdate);
        }
      }
      
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error(t("Failed to load messages", "加载消息失败"));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [user, t]);
  
  return { messages, setMessages, fetchMessages, loading };
};
