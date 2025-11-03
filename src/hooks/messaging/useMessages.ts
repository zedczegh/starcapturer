
import { useState, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchFromSupabase } from '@/utils/supabaseFetch';
import { extractLocationFromUrl } from '@/utils/locationLinkParser';
import { optimizedCache } from '@/utils/optimizedCache';

const MESSAGE_CACHE_KEY_PREFIX = 'messages_';
const MESSAGE_CACHE_TTL = 60000; // 1 minute cache for messages

export const useMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const fetchInProgressRef = useRef<Record<string, boolean>>({});
  const lastFetchTimeRef = useRef<Record<string, number>>({});
  const activePartnerRef = useRef<string | null>(null);
  
  // Cache the message parsing function
  const parseMessageData = useMemo(() => (msg: any) => {
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
    
    // Check if text message contains a location link
    if (!locationData && msg.message) {
      const extractedLocation = extractLocationFromUrl(msg.message);
      if (extractedLocation) {
        locationData = extractedLocation;
        // When location is extracted from a URL, set text to empty to hide the raw URL
        return {
          id: msg.id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          text: '', // Clear the raw URL from display
          created_at: msg.created_at,
          image_url: msg.image_url,
          location: extractedLocation, // Use extracted location data
          read: msg.read // Include read status for checkmark functionality
        };
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
  }, []);
  
  const fetchMessages = useCallback(async (conversationPartnerId: string) => {
    if (!user || !conversationPartnerId) {
      console.log("Missing user or conversation partner ID");
      return;
    }
    
    // Update active partner reference
    activePartnerRef.current = conversationPartnerId;
    
    // Implement cache-based throttling to prevent excessive fetching
    const now = Date.now();
    const lastFetchTime = lastFetchTimeRef.current[conversationPartnerId] || 0;
    const timeSinceLastFetch = now - lastFetchTime;
    
    // Only fetch if it's been more than 500ms since the last fetch for this conversation
    // Unless it's the first fetch (lastFetchTime === 0)
    if (lastFetchTime !== 0 && timeSinceLastFetch < 500) {
      console.log(`Throttling message fetch for ${conversationPartnerId}, last fetch was ${timeSinceLastFetch}ms ago`);
      return;
    }
    
    // Prevent duplicate requests for the same conversation
    if (fetchInProgressRef.current[conversationPartnerId]) {
      console.log("Fetch already in progress for this conversation, skipping");
      return;
    }
    
    fetchInProgressRef.current[conversationPartnerId] = true;
    setLoading(true);
    
    // Update last fetch time
    lastFetchTimeRef.current[conversationPartnerId] = now;
    
    try {
      // Check cache first
      const cacheKey = `${MESSAGE_CACHE_KEY_PREFIX}${user.id}_${conversationPartnerId}`;
      const cachedMessages = optimizedCache.getCachedItem<any[]>(cacheKey);
      
      if (cachedMessages) {
        console.log("Using cached messages:", cachedMessages.length);
        setMessages(cachedMessages);
        // Don't return early - still fetch fresh messages in the background
      }
      
      // Build query for messages between the two users
      const messagesData = await fetchFromSupabase(
        'user_messages',
        (query) => query
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conversationPartnerId}),and(sender_id.eq.${conversationPartnerId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true }),
        { skipCache: true } // Always get fresh messages
      );
      
      console.log("Fetched messages:", messagesData.length);
      
      // Only proceed if this is still the active conversation
      if (activePartnerRef.current !== conversationPartnerId) {
        console.log("Partner ID changed during fetch, discarding results");
        return;
      }
      
      // Transform the messages to the expected format using the memoized parser
      const formattedMessages = messagesData.map(parseMessageData);
      
      // Update cache
      optimizedCache.setCachedItem(cacheKey, formattedMessages, MESSAGE_CACHE_TTL);
      
      // Fix the type error by ensuring we're setting an array
      setMessages(formattedMessages);
      
      // Mark messages as read in a non-blocking way
      if (messagesData && messagesData.length > 0) {
        const messagesToUpdate = messagesData
          .filter(msg => msg.receiver_id === user.id && !msg.read)
          .map(msg => msg.id);
        
        if (messagesToUpdate.length > 0) {
          // Use a proper pattern for background Promise handling
          (async () => {
            try {
              await supabase
                .from('user_messages')
                .update({ read: true })
                .in('id', messagesToUpdate);
              
              console.log("Updated read status for", messagesToUpdate.length, "messages");
            } catch (error) {
              console.error("Error updating message read status:", error);
            }
          })();
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error(
        t("Failed to load messages", "加载消息失败"),
        t("Please try again", "请重试")
      );
    } finally {
      setLoading(false);
      fetchInProgressRef.current[conversationPartnerId] = false;
    }
  }, [user, t, parseMessageData, toast]);
  
  return { messages, setMessages, fetchMessages, loading };
};
