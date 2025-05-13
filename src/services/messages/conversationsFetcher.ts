
import { supabase } from "@/integrations/supabase/client";
import { optimizedCache } from "@/utils/optimizedCache";
import { ConversationPartner } from "@/hooks/messaging/types";

const CONVERSATIONS_CACHE_KEY = 'user_conversations';
const CONVERSATIONS_CACHE_TTL = 300000; // 5 minutes

/**
 * Fetch conversations for a user from Supabase or cache
 * @param userId - The current user ID
 * @param formatMessagePreview - Function to format message previews
 * @param forceFresh - Whether to force a fresh fetch bypassing cache
 * @returns Array of conversation partners
 */
export const fetchUserConversations = async (
  userId: string,
  formatMessagePreview: (message: string) => string,
  forceFresh = false
): Promise<ConversationPartner[]> => {
  if (!userId) {
    console.log("Missing user ID for conversation fetch");
    return [];
  }

  // Check cache first unless forced fresh
  if (!forceFresh) {
    const cacheKey = `${CONVERSATIONS_CACHE_KEY}_${userId}`;
    const cachedConversations = optimizedCache.getCachedItem<ConversationPartner[]>(cacheKey);
    
    if (cachedConversations && cachedConversations.length > 0) {
      console.log("Using cached conversations:", cachedConversations.length);
      return cachedConversations;
    }
  }
  
  console.log("Fetching conversations for user:", userId);
  
  try {
    // Fetch all messages related to the user
    const { data: messagesData, error: messagesError } = await supabase
      .from('user_messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (messagesError) throw messagesError;

    if (!messagesData || messagesData.length === 0) {
      console.log("No messages found");
      return [];
    }

    // Extract unique user IDs from messages - using a Set for better performance
    const uniqueUserIds = new Set<string>();
    messagesData.forEach(msg => {
      if (msg.sender_id !== userId) uniqueUserIds.add(msg.sender_id);
      if (msg.receiver_id !== userId) uniqueUserIds.add(msg.receiver_id);
    });
    
    // Convert the Set to an Array for the in() filter
    const userIdsArray = Array.from(uniqueUserIds);
    
    if (userIdsArray.length === 0) {
      console.log("No unique user IDs found");
      return [];
    }

    // Fetch profiles for all unique users
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id,username,avatar_url')
      .in('id', userIdsArray);

    if (profilesError) throw profilesError;

    // Create a map of user IDs to profiles for quick lookup
    const profilesMap = new Map();
    profilesData?.forEach(profile => {
      profilesMap.set(profile.id, profile);
    });

    // Group messages by conversation partner - using a Map for better performance
    const conversationsMap = new Map<string, ConversationPartner>();

    // Process messages in reverse chronological order
    messagesData.forEach(msg => {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      
      if (!conversationsMap.has(partnerId)) {
        const profile = profilesMap.get(partnerId);
        conversationsMap.set(partnerId, {
          id: partnerId,
          username: profile?.username || "User",
          avatar_url: profile?.avatar_url || null,
          last_message: formatMessagePreview(msg.message),
          last_message_time: msg.created_at,
          unread_count: msg.sender_id !== userId && !msg.read ? 1 : 0
        });
      } else {
        const existingConv = conversationsMap.get(partnerId);
        const msgTime = new Date(msg.created_at).getTime();
        const existingTime = new Date(existingConv.last_message_time).getTime();
        
        if (msgTime > existingTime) {
          existingConv.last_message = formatMessagePreview(msg.message);
          existingConv.last_message_time = msg.created_at;
        }
        
        if (msg.sender_id !== userId && !msg.read) {
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
      const cacheKey = `${CONVERSATIONS_CACHE_KEY}_${userId}`;
      optimizedCache.setCachedItem(cacheKey, conversationsArray, CONVERSATIONS_CACHE_TTL);
    }
    
    return conversationsArray;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw error;
  }
};
