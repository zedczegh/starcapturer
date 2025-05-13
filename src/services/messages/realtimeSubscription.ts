
import { supabase } from "@/integrations/supabase/client";

/**
 * Set up realtime subscription for message changes
 * @param userId - The current user's ID
 * @param onMessageChange - Callback to handle message changes
 * @returns Object with channel and cleanup function
 */
export const setupMessageSubscription = (
  userId: string,
  onMessageChange: () => void
) => {
  if (!userId) return { channel: null, cleanup: () => {} };
  
  // Create a combined channel for all message events (INSERT, UPDATE, DELETE)
  const channel = supabase
    .channel('messages_changes')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'user_messages',
        filter: `receiver_id=eq.${userId}`
      }, 
      (payload) => {
        console.log("New message received:", payload);
        onMessageChange();
      }
    )
    .on('postgres_changes', 
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'user_messages',
        filter: `receiver_id=eq.${userId}`
      }, 
      (payload) => {
        console.log("Message updated:", payload);
        onMessageChange();
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
        onMessageChange();
      }
    )
    .subscribe((status) => {
      console.log("Realtime subscription status:", status);
    });
    
  const cleanup = () => {
    console.log("Cleaning up realtime subscription");
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
  
  return { channel, cleanup };
};
