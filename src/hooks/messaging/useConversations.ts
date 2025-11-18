
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { optimizedCache } from "@/utils/optimizedCache";
import { extractLocationFromUrl } from '@/utils/locationLinkParser';

const CONVERSATIONS_CACHE_KEY = 'user_conversations';
const CONVERSATIONS_CACHE_TTL = 300000; // 5 minutes

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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  /**
   * Format message text for conversation preview
   */
  const formatMessagePreview = useCallback((message: string): string => {
    if (!message) return "";
    
    // Check if the message is a JSON string containing location data
    if (message.startsWith('{"type":"location"')) {
      try {
        const parsedData = JSON.parse(message);
        if (parsedData.type === 'location' && parsedData.data) {
          return t("📍 Shared a location", "📍 分享了位置");
        }
      } catch (e) {
        // Not valid JSON, continue with other checks
      }
    }
    
    // Check if message contains a location link
    const extractedLocation = extractLocationFromUrl(message);
    if (extractedLocation) {
      if (extractedLocation.isAstroSpot) {
        return t("🔭 AstroSpot", "🔭 观星点");
      } else {
        return t("📍 Shared a location", "📍 分享了位置");
      }
    }
    
    // If it's a regular message, return it (truncated if needed)
    if (message.length > 30) {
      return message.substring(0, 30) + "...";
    }
    
    return message;
  }, [t]);

  const fetchConversations = useCallback(async (forceFresh = false) => {
    if (!user) return;
    
    // Only show loading on initial load
    if (conversations.length === 0) {
      setLoading(true);
    }

    try {
      // Check cache first unless forced fresh
      if (!forceFresh) {
        const cacheKey = `${CONVERSATIONS_CACHE_KEY}_${user.id}`;
        const cachedConversations = optimizedCache.getCachedItem<ConversationPartner[]>(cacheKey);
        
        if (cachedConversations && cachedConversations.length > 0) {
          console.log("Using cached conversations:", cachedConversations.length);
          setConversations(cachedConversations);
          setLoading(false);
          
          // Background refresh without delay
          if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
          }
          fetchTimeoutRef.current = setTimeout(() => {
            fetchConversations(true);
          }, 100);
          
          return;
        }
      }
      
      console.log("Fetching conversations for user:", user.id);
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('user_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        console.log("No messages found");
        setConversations([]);
        setLoading(false);
        return;
      }

      // Filter out self-messages and post interaction notifications
      const filteredMessages = messagesData.filter(msg => {
        // Exclude self-messages
        if (msg.sender_id === msg.receiver_id) return false;
        
        // Exclude post interaction notifications
        const metadata = msg.metadata as any;
        if (metadata?.type === 'post_interaction') return false;
        
        return true;
      });

      if (filteredMessages.length === 0) {
        console.log("No valid messages found after filtering");
        setConversations([]);
        setLoading(false);
        return;
      }

      // Extract unique user IDs from messages - using a Set for better performance
      const uniqueUserIds = new Set<string>();
      filteredMessages.forEach(msg => {
        if (msg.sender_id !== user.id) uniqueUserIds.add(msg.sender_id);
        if (msg.receiver_id !== user.id) uniqueUserIds.add(msg.receiver_id);
      });
      
      // Convert the Set to an Array for the in() filter
      const userIdsArray = Array.from(uniqueUserIds);
      
      if (userIdsArray.length === 0) {
        console.log("No unique user IDs found");
        setConversations([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for all unique users
      const { data: profilesData, error: profilesError } = await supabase
        .rpc('get_public_profiles', { p_user_ids: userIdsArray });

      if (profilesError) throw profilesError;

      // Create a map of user IDs to profiles for quick lookup
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Group messages by conversation partner - using a Map for better performance
      const conversationsMap = new Map<string, ConversationPartner>();

      // Process messages in reverse chronological order
      filteredMessages.forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationsMap.has(partnerId)) {
          const profile = profilesMap.get(partnerId);
          conversationsMap.set(partnerId, {
            id: partnerId,
            username: profile?.username || "User",
            avatar_url: profile?.avatar_url || null,
            last_message: formatMessagePreview(msg.message), // Format the message preview
            last_message_time: msg.created_at,
            unread_count: msg.sender_id !== user.id && !msg.read ? 1 : 0
          });
        } else {
          const existingConv = conversationsMap.get(partnerId);
          const msgTime = new Date(msg.created_at).getTime();
          const existingTime = new Date(existingConv.last_message_time).getTime();
          
          if (msgTime > existingTime) {
            existingConv.last_message = formatMessagePreview(msg.message); // Format the message preview
            existingConv.last_message_time = msg.created_at;
          }
          
          if (msg.sender_id !== user.id && !msg.read) {
            existingConv.unread_count += 1;
          }
        }
      });
      
      // Convert the Map to an Array for the state update
      const conversationsArray = Array.from(conversationsMap.values());
      
      // Sort conversations by last message time (newest first)
      conversationsArray.sort((a, b) => {
        return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
      });
      
      console.log("Fetched conversations:", conversationsArray.length);
      
      // Cache the fetched conversations
      if (conversationsArray.length > 0) {
        const cacheKey = `${CONVERSATIONS_CACHE_KEY}_${user.id}`;
        optimizedCache.setCachedItem(cacheKey, conversationsArray, CONVERSATIONS_CACHE_TTL);
      }
      
      setConversations(conversationsArray);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error(t("Failed to load conversations", "加载对话失败"));
    } finally {
      setLoading(false);
    }
  }, [user, t, conversations.length, formatMessagePreview]);
  
  // Set up real-time subscription for message changes
  useEffect(() => {
    if (!user) return;
    
    fetchConversations();

    // Clean up existing channel if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create a combined channel for all message events (INSERT, UPDATE, DELETE)
    const channel = supabase
      .channel('messages_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'user_messages',
          filter: `receiver_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log("New message received:", payload);
          // Use a debounced fetch to prevent multiple fetches for batch inserts
          if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
          }
          fetchTimeoutRef.current = setTimeout(() => {
            fetchConversations(true);
          }, 300);
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'user_messages',
          filter: `receiver_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log("Message updated:", payload);
          // Use a debounced fetch to prevent multiple fetches for batch updates
          if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
          }
          fetchTimeoutRef.current = setTimeout(() => {
            fetchConversations(true);
          }, 300);
        }
      )
      .on('postgres_changes', 
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'user_messages'
        }, 
        (payload) => {
          console.log("Message deleted:", payload);
          // Use a debounced fetch to prevent multiple fetches for batch deletes
          if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
          }
          fetchTimeoutRef.current = setTimeout(() => {
            fetchConversations(true);
          }, 300);
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });
      
    // Store channel reference for cleanup
    channelRef.current = channel;
      
    return () => {
      console.log("Cleaning up realtime subscription");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [user, fetchConversations]);
  
  return {
    conversations,
    loading,
    fetchConversations
  };
};
