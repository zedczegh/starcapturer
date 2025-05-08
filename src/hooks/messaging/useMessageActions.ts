
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export const useMessageActions = (
  refreshMessages: (conversationPartnerId: string) => Promise<void>, 
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const sendMessage = useCallback(async (
    text: string, 
    imageFile?: File | null,
    locationData?: { latitude: number; longitude: number; name: string; timestamp: string }
  ) => {
    if (!user) return;
    
    // Find the active conversation partner ID
    const urlParams = new URLSearchParams(window.location.search);
    const conversationPartnerId = urlParams.get('with');
    
    if (!conversationPartnerId) {
      console.error("No conversation partner found");
      return;
    }
    
    setSending(true);
    
    try {
      let imageUrl = null;
      
      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError, data } = await supabase
          .storage
          .from('message_images')
          .upload(filePath, imageFile);
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data: { publicUrl } } = supabase
          .storage
          .from('message_images')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
      }
      
      // Create the message object
      const messageData: any = {
        sender_id: user.id,
        receiver_id: conversationPartnerId,
        message: text,
        read: false,
      };
      
      // Add image URL if available
      if (imageUrl) {
        messageData.image_url = imageUrl;
      }
      
      // Add location data if provided
      if (locationData) {
        messageData.location = locationData;
      }
      
      // Insert the message into the database
      const { data: newMessage, error } = await supabase
        .from('user_messages')
        .insert(messageData)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Update the messages in the UI optimistically
      setMessages(prevMessages => [
        ...prevMessages, 
        {
          id: newMessage.id,
          sender_id: user.id,
          receiver_id: conversationPartnerId,
          text: text,
          created_at: newMessage.created_at,
          image_url: imageUrl,
          location: locationData,
          read: false // New message starts as unread
        }
      ]);
      
      // Refresh messages from the server
      await refreshMessages(conversationPartnerId);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("Failed to send message", "发送消息失败"));
    } finally {
      setSending(false);
    }
  }, [user, setMessages, refreshMessages, t]);
  
  const unsendMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Find the message
      const { data: messageData, error: fetchError } = await supabase
        .from('user_messages')
        .select('*')
        .eq('id', messageId)
        .single();
        
      if (fetchError) {
        throw fetchError;
      }
      
      // Check if user is the sender
      if (messageData.sender_id !== user.id) {
        toast.error(t("You can only unsend your own messages", "只能撤回自己的消息"));
        return false;
      }
      
      // Delete the message
      const { error: deleteError } = await supabase
        .from('user_messages')
        .delete()
        .eq('id', messageId);
        
      if (deleteError) {
        throw deleteError;
      }
      
      // Update the UI
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
      
      toast.success(t("Message unsent", "消息已撤回"));
      return true;
      
    } catch (error) {
      console.error("Error unsending message:", error);
      toast.error(t("Failed to unsend message", "撤回消息失败"));
      return false;
    }
  }, [user, setMessages, t]);
  
  return { sending, sendMessage, unsendMessage };
};

export default useMessageActions;
