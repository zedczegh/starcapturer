
import { supabase } from '@/integrations/supabase/client';
import { fetchFromSupabase } from '@/utils/supabaseFetch';
import { parseMessageData } from '@/hooks/messaging/utils/messageParsers';
import { getCachedMessages, cacheMessages } from '@/hooks/messaging/utils/messageCache';

/**
 * Fetch messages between two users
 * @param currentUserId - The current user's ID
 * @param partnerId - The conversation partner's ID
 * @param useCache - Whether to use cached messages (default: true)
 * @returns Array of formatted messages
 */
export const fetchMessagesForConversation = async (
  currentUserId: string, 
  partnerId: string,
  useCache: boolean = true
) => {
  // Check cache first if enabled
  if (useCache) {
    const cachedMessages = getCachedMessages<any>(currentUserId, partnerId);
    if (cachedMessages) {
      console.log("Using cached messages");
      return cachedMessages;
    }
  }

  // Use optimized fetch utility with skipCache to always get fresh data
  const messagesData = await fetchFromSupabase(
    'user_messages',
    (query) => query
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true }),
    { skipCache: true } // Always get fresh messages
  );
  
  console.log("Fetched messages:", messagesData.length);
  
  // Transform the messages to the expected format using the parser
  const formattedMessages = messagesData.map(parseMessageData);
  
  // Update cache
  cacheMessages(currentUserId, partnerId, formattedMessages);
  
  return formattedMessages;
};

/**
 * Mark messages as read
 * @param currentUserId - The current user's ID
 * @param messages - Array of message data
 */
export const markMessagesAsRead = async (currentUserId: string, messages: any[]) => {
  if (!messages || messages.length === 0) return;
  
  const messagesToUpdate = messages
    .filter(msg => msg.receiver_id === currentUserId && !msg.read)
    .map(msg => msg.id);
  
  if (messagesToUpdate.length > 0) {
    try {
      await supabase
        .from('user_messages')
        .update({ read: true })
        .in('id', messagesToUpdate);
      
      console.log("Updated read status for", messagesToUpdate.length, "messages");
    } catch (error) {
      console.error("Error updating message read status:", error);
    }
  }
};
