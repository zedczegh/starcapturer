
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export const useMessageActions = (fetchMessages: (partnerId: string) => Promise<void>, setMessages: React.Dispatch<React.SetStateAction<any[]>>) => {
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const sendMessage = async (text: string, imageFile?: File | null, locationData?: any) => {
    if (!user) return;
    
    setSending(true);
    try {
      const receiver_id = window.location.pathname.includes('/messages')
        ? document.querySelector('[data-active-conversation-id]')?.getAttribute('data-active-conversation-id') || ''
        : '';
      
      if (!receiver_id) {
        toast.error(t("Failed to send: No recipient selected", "发送失败：未选择收件人"));
        return;
      }
      
      let image_url = null;
      
      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('message_images')
          .upload(filePath, imageFile);
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Get the public URL for the uploaded image
        const { data: urlData } = await supabase
          .storage
          .from('message_images')
          .getPublicUrl(filePath);
          
        image_url = urlData.publicUrl;
      }
      
      // Prepare message content - either regular text or location data in JSON format
      const messageContent = locationData 
        ? JSON.stringify({
            type: 'location',
            data: locationData
          })
        : text;
      
      // Insert the message
      const { error } = await supabase
        .from('user_messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiver_id,
          message: messageContent,
          image_url: image_url
        });
        
      if (error) throw error;
      
      // Fetch updated messages
      await fetchMessages(receiver_id);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("Failed to send message", "发送消息失败"));
    } finally {
      setSending(false);
    }
  };
  
  const unsendMessage = async (messageId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('user_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);
        
      if (error) throw error;
      
      // Update the messages state by removing the unsent message
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
      return true;
    } catch (error) {
      console.error("Error unsending message:", error);
      toast.error(t("Failed to unsend message", "撤回消息失败"));
      return false;
    }
  };

  const deleteConversation = async (partnerId: string): Promise<boolean> => {
    if (!user || !partnerId) return false;
    
    try {
      console.log(`Attempting to delete conversation with partner ID: ${partnerId}`);
      
      // First, delete one direction of messages (user to partner)
      const { error: error1 } = await supabase
        .from('user_messages')
        .delete()
        .eq('sender_id', user.id)
        .eq('receiver_id', partnerId);
        
      if (error1) throw error1;
      
      // Then delete the other direction (partner to user)
      const { error: error2 } = await supabase
        .from('user_messages')
        .delete()
        .eq('sender_id', partnerId)
        .eq('receiver_id', user.id);
        
      if (error2) throw error2;
      
      console.log("Conversation deletion completed successfully");
      
      // Clear messages for this conversation
      setMessages([]);
      
      return true;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error(t("Failed to delete conversation", "删除对话失败"));
      return false;
    }
  };
  
  return { sending, sendMessage, unsendMessage, deleteConversation };
};
