
import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchMessagesForConversation, markMessagesAsRead } from '@/services/messages/messageFetcher';

/**
 * Hook for managing message data and operations
 */
export const useMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const fetchInProgressRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<Record<string, number>>({});
  
  const fetchMessages = useCallback(async (conversationPartnerId: string) => {
    if (!user || !conversationPartnerId) {
      console.log("Missing user or conversation partner ID");
      return;
    }
    
    // Implement cache-based throttling to prevent excessive fetching
    const now = Date.now();
    const lastFetchTime = lastFetchTimeRef.current[conversationPartnerId] || 0;
    const timeSinceLastFetch = now - lastFetchTime;
    
    // Only fetch if it's been more than 2 seconds since the last fetch for this conversation
    // Unless it's the first fetch (lastFetchTime === 0)
    if (lastFetchTime !== 0 && timeSinceLastFetch < 2000) {
      console.log(`Throttling message fetch for ${conversationPartnerId}, last fetch was ${timeSinceLastFetch}ms ago`);
      return;
    }
    
    // Prevent duplicate requests
    if (fetchInProgressRef.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }
    
    fetchInProgressRef.current = true;
    setLoading(true);
    
    // Update last fetch time
    lastFetchTimeRef.current[conversationPartnerId] = now;
    
    try {
      const formattedMessages = await fetchMessagesForConversation(
        user.id,
        conversationPartnerId
      );
      
      // Fix the type error by ensuring we're setting an array
      setMessages(formattedMessages as any[]);
      
      // Mark messages as read in a non-blocking way
      if (formattedMessages && formattedMessages.length > 0) {
        markMessagesAsRead(user.id, formattedMessages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error(t("Failed to load messages", "加载消息失败"));
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [user, t]);
  
  return { messages, setMessages, fetchMessages, loading };
};
