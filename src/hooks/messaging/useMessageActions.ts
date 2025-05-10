
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { formatLocationShareMessage } from '@/utils/messageUtils';

export const useMessageActions = (
  fetchMessages: (conversationId: string) => Promise<void>,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const sendMessage = async (
    content: string, 
    imageFile?: File | null, 
    locationData?: any
  ) => {
    if (!user) return;
    
    setSending(true);
    
    try {
      const receiverId = content.startsWith('@') 
        ? content.split(' ')[0].substring(1) 
        : null;
      
      let finalContent = content;
      let payload = null;
      
      // If locationData is provided, format it as a location share message
      if (locationData) {
        const formattedMessage = formatLocationShareMessage(locationData, content);
        finalContent = formattedMessage.text;
        payload = formattedMessage.payload;
      }
      
      const messageId = uuid();
      
      let messageData = {
        id: messageId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: finalContent,
        payload: payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        read: false
      };
      
      if (imageFile) {
        // Handle image upload and add image URL to message
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `messages/${user.id}/${messageId}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('message_images')
          .upload(filePath, imageFile);
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('message_images')
          .getPublicUrl(filePath);
          
        messageData.image_url = publicUrl;
      }
      
      const { error } = await supabase
        .from('messages')
        .insert(messageData);
        
      if (error) throw error;
      
      // Optimistic update of messages
      setMessages(prev => [...prev, messageData]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const unsendMessage = async (messageId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user?.id);
        
      if (error) throw error;
      
      // Update local state
      setMessages(prev => prev.filter(m => m.id !== messageId));
      return true;
    } catch (error) {
      console.error('Error unsending message:', error);
      toast.error('Failed to unsend message');
      return false;
    }
  };

  return {
    sending,
    sendMessage,
    unsendMessage
  };
};
