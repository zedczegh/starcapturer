
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
    if (!user || !conversationPartnerId) return;
    
    setLoading(true);
    
    try {
      // In a real app, fetch messages from your API or database
      // For this demo, we'll simulate fetching messages after a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate some test messages
      const demoMessages = [
        {
          id: 'msg-1',
          sender_id: user.id,
          receiver_id: conversationPartnerId,
          text: 'Hi there! 👋',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'msg-2',
          sender_id: conversationPartnerId,
          receiver_id: user.id,
          text: 'Hello! How are you? 😊',
          created_at: new Date(Date.now() - 3500000).toISOString(),
        },
        {
          id: 'msg-3',
          sender_id: user.id,
          receiver_id: conversationPartnerId,
          text: 'I\'m doing great! Just checking the cool location sharing feature.',
          created_at: new Date(Date.now() - 3400000).toISOString(),
        }
      ];
      
      setMessages(demoMessages);
      
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
