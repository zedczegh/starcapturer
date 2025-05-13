
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { optimizedCache } from '@/utils/optimizedCache';
import { v4 as uuidv4 } from 'uuid';

// Helper function to clear related caches after message operations
const clearMessageCaches = (partnerId: string, userId?: string) => {
  if (userId) {
    optimizedCache.removeCachedItem(`messages_${userId}_${partnerId}`);
    optimizedCache.removeCachedItem(`messages_${partnerId}_${userId}`);
    optimizedCache.removeCachedItem(`user_conversations_${userId}`);
  }
};

export const useMessageActions = (
  fetchMessages: (partnerId: string) => Promise<void>,
  fetchConversations: (forceFresh?: boolean) => Promise<void>,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  const sendMessage = useCallback(
    async (receiverId: string, messageText: string, imageFile?: File | null, locationData?: any) => {
      if (!user || !receiverId) {
        console.error('Missing user or receiver ID');
        return;
      }

      setSending(true);
      try {
        let finalMessage = messageText;
        let imageUrl = null;

        // Process location data if provided
        if (locationData) {
          // Format location data as JSON string
          finalMessage = JSON.stringify({
            type: 'location',
            data: {
              ...locationData,
              timestamp: new Date().toISOString(),
              userId: user.id,
            },
          });
        }

        // Upload image if provided
        if (imageFile) {
          const fileExt = imageFile.name.split('.').pop();
          const filePath = `${user.id}/${uuidv4()}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('message_images')
            .upload(filePath, imageFile);

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL for the uploaded image
          const { data: urlData } = supabase.storage.from('message_images').getPublicUrl(filePath);
          imageUrl = urlData?.publicUrl;
        }

        // Insert the message
        const { error } = await supabase.from('user_messages').insert({
          sender_id: user.id,
          receiver_id: receiverId,
          message: finalMessage,
          image_url: imageUrl,
        });

        if (error) {
          throw error;
        }

        // Clear related caches
        clearMessageCaches(receiverId, user.id);
        
        // Success!
        console.log('Message sent successfully');
      } catch (error: any) {
        console.error('Error sending message:', error.message);
        toast({
          variant: "destructive",
          title: t("Error sending message", "发送消息出错"),
          description: error.message
        });
        throw error;
      } finally {
        setSending(false);
      }
    },
    [user, t]
  );

  const unsendMessage = useCallback(
    async (messageId: string): Promise<boolean> => {
      if (!user) {
        toast({
          variant: "destructive",
          title: t("Not authenticated", "未经身份验证"),
          description: t("Please log in to manage messages", "请登录以管理消息")
        });
        return false;
      }

      try {
        // First get the message to verify ownership and get the receiver ID
        const { data: messageData, error: fetchError } = await supabase
          .from('user_messages')
          .select('sender_id, receiver_id')
          .eq('id', messageId)
          .single();

        if (fetchError) throw fetchError;
        
        // Verify the user is the sender
        if (messageData.sender_id !== user.id) {
          toast({
            variant: "destructive",
            title: t("Unauthorized", "未授权"),
            description: t("You can only unsend your own messages", "您只能撤回自己的消息")
          });
          return false;
        }

        // Delete the message
        const { error: deleteError } = await supabase
          .from('user_messages')
          .delete()
          .eq('id', messageId);

        if (deleteError) throw deleteError;

        // Clear caches
        clearMessageCaches(messageData.receiver_id, user.id);
        
        // Update local message list (filter out removed message)
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));

        // Refresh conversations
        fetchConversations(true);
        
        return true;
      } catch (error: any) {
        console.error('Error unsending message:', error.message);
        toast({
          variant: "destructive",
          title: t("Error unsending message", "撤回消息出错"),
          description: error.message
        });
        return false;
      }
    },
    [user, setMessages, fetchConversations, t]
  );

  const deleteConversation = useCallback(
    async (partnerId: string): Promise<boolean> => {
      if (!user) {
        toast({
          variant: "destructive",
          title: t("Not authenticated", "未经身份验证"),
          description: t("Please log in to manage messages", "请登录以管理消息")
        });
        return false;
      }

      try {
        // Call the delete_conversation PostgreSQL function
        const { error } = await supabase.rpc('delete_conversation', {
          partner_id: partnerId,
          current_user_id: user.id,
        });

        if (error) throw error;
        
        // Clear caches
        clearMessageCaches(partnerId, user.id);
        optimizedCache.removeCachedItem(`user_conversations_${user.id}`);
        
        // Refresh conversations list
        fetchConversations(true);
        
        return true;
      } catch (error: any) {
        console.error('Error deleting conversation:', error.message);
        toast({
          variant: "destructive",
          title: t("Error deleting conversation", "删除对话出错"),
          description: error.message
        });
        return false;
      }
    },
    [user, fetchConversations, t]
  );

  return { sending, sendMessage, unsendMessage, deleteConversation };
};
