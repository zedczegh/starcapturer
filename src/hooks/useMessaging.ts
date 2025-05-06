
import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from './messaging/useConversations';
import { useMessageOperations } from './messaging/useMessageOperations';

export function useMessaging() {
  const { user } = useAuth();
  const { conversations, setConversations, loading, fetchConversations } = useConversations(user?.id);
  const { messages, sending, fetchMessages, sendMessage } = useMessageOperations(user?.id);

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
    messages,
    loading,
    sending,
    fetchMessages,
    sendMessage,
  };
}
