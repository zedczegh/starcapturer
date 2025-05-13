
import { useState, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchFromSupabase } from '@/utils/supabaseFetch';
import { extractLocationFromUrl } from '@/utils/locationLinkParser';
import { optimizedCache } from '@/utils/optimizedCache';

// Optimize cache settings for better performance
const MESSAGE_CACHE_KEY_PREFIX = 'messages_';
const MESSAGE_CACHE_TTL = 5 * 60 * 1000; // 5 minute cache for messages (extended from 1 min)
const MESSAGE_FETCH_THROTTLE = 1000; // 1 second throttle (reduced from 2 seconds)

export const useMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const fetchInProgressRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<Record<string, number>>({});
  
  // Cache the message parsing function
  const parseMessageData = useMemo(() => (msg: any) => {
    // Skip processing null or undefined messages
    if (!msg) return null;
    
    // Parse location from message JSON if it exists
    let locationData = null;
    if (msg.message && typeof msg.message === 'string' && msg.message.startsWith('{"type":"location"')) {
      try {
        const parsedData = JSON.parse(msg.message);
        if (parsedData.type === 'location' && parsedData.data) {
          locationData = parsedData.data;
          console.log("Parsed location data from JSON:", locationData);
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
        console.log("Location extracted from URL:", locationData);
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
    
    // Cache check and throttling with improved logic
    const now = Date.now();
    const lastFetchTime = lastFetchTimeRef.current[conversationPartnerId] || 0;
    const timeSinceLastFetch = now - lastFetchTime;
    const cacheKey = `${MESSAGE_CACHE_KEY_PREFIX}${user.id}_${conversationPartnerId}`;
    
    // Use cache for very frequent requests but still allow occasional refresh
    if (lastFetchTime !== 0 && timeSinceLastFetch < MESSAGE_FETCH_THROTTLE) {
      console.log(`Throttling message fetch for ${conversationPartnerId}, last fetch was ${timeSinceLastFetch}ms ago`);
      
      // Show cached data immediately if available
      const cachedMessages = optimizedCache.getCachedItem<any[]>(cacheKey);
      if (cachedMessages && cachedMessages.length > 0) {
        console.log("Using cached messages due to throttling");
        setMessages(cachedMessages);
      }
      return;
    }
    
    // Prevent duplicate requests and set loading state
    if (fetchInProgressRef.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }
    
    fetchInProgressRef.current = true;
    setLoading(true);
    
    // Update last fetch time early to prevent race conditions
    lastFetchTimeRef.current[conversationPartnerId] = now;
    
    try {
      // Always check cache first for immediate display
      const cachedMessages = optimizedCache.getCachedItem<any[]>(cacheKey);
      
      if (cachedMessages && cachedMessages.length > 0) {
        console.log("Using cached messages while fetching fresh data");
        setMessages(cachedMessages);
      }
      
      // Set a fetch timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Fetch timeout")), 8000)
      );
      
      // Fetch latest messages with timeout
      const fetchPromise = fetchFromSupabase(
        'user_messages',
        (query) => query
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conversationPartnerId}),and(sender_id.eq.${conversationPartnerId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true }),
        { skipCache: true } // Always get fresh messages
      );
      
      // Use Promise.race to implement timeout
      const messagesData = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log("Fetched messages:", messagesData?.length || 0);
      
      // Filter out null/undefined messages and transform valid ones
      const formattedMessages = Array.isArray(messagesData) ? 
        messagesData
          .filter(msg => msg) // Filter out null/undefined messages
          .map(parseMessageData)
          .filter(msg => msg) // Filter out any messages that became null during parsing
        : [];
      
      // Update cache
      optimizedCache.setCachedItem(cacheKey, formattedMessages, MESSAGE_CACHE_TTL);
      
      // Fix the type error by ensuring we're setting an array
      setMessages(formattedMessages as any[]);
      setLoading(false);
      
      // Mark messages as read in a non-blocking way
      if (messagesData && messagesData.length > 0) {
        const messagesToUpdate = messagesData
          .filter(msg => msg && msg.receiver_id === user.id && !msg.read)
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
      // Only show error toast if we have no cached data to display
      if (messages.length === 0) {
        toast.error(t("Failed to load messages", "加载消息失败"));
      }
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [user, t, parseMessageData, messages.length]);
  
  return { messages, setMessages, fetchMessages, loading };
};
