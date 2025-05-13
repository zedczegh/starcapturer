
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client"; // Adding missing import
import { ConversationPartner } from "./types";
import { useMessageFormatter } from "@/utils/messages/messageFormatter";
import { fetchUserConversations } from "@/services/messages/conversationsFetcher";
import { setupMessageSubscription } from "@/services/messages/realtimeSubscription";

export { ConversationPartner } from "./types";

export const useConversations = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatMessagePreview } = useMessageFormatter();
  const [conversations, setConversations] = useState<ConversationPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchConversations = useCallback(async (forceFresh = false) => {
    if (!user) return;
    
    // Only show loading indicator on initial load or forced refresh
    if (conversations.length === 0 || forceFresh) {
      setLoading(true);
    }

    try {
      const conversationsArray = await fetchUserConversations(user.id, formatMessagePreview, forceFresh);
      setConversations(conversationsArray);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error(t("Failed to load conversations", "加载对话失败"));
    } finally {
      setLoading(false);
    }
  }, [user, t, conversations.length, formatMessagePreview]);
  
  // Handle realtime message changes
  const handleMessageChange = useCallback(() => {
    // Use a debounced fetch to prevent multiple fetches for batch operations
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = setTimeout(() => {
      fetchConversations(true);
    }, 300);
  }, [fetchConversations]);
  
  // Set up real-time subscription for message changes
  useEffect(() => {
    if (!user) return;
    
    fetchConversations();

    // Clean up existing channel if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Set up new subscription
    const { channel, cleanup } = setupMessageSubscription(user.id, handleMessageChange);
      
    // Store channel reference for cleanup
    channelRef.current = channel;
      
    return () => {
      cleanup();
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [user, fetchConversations, handleMessageChange]);
  
  return {
    conversations,
    loading,
    fetchConversations
  };
};
