
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMessageUpload } from './useMessageUpload';
import { Message } from './useMessages';

export const useMessageActions = (
  fetchMessages: (partnerId: string) => Promise<void>,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);
  const { uploadMessageImage } = useMessageUpload();
  
  const sendMessage = useCallback(async (receiverId: string, message: string, imageFile?: File | null) => {
    if (!user || (!message.trim() && !imageFile) || sending) return false;
    
    setSending(true);
    try {
      let image_url = null;
      
      // If an image file was provided, upload it
      if (imageFile) {
        image_url = await uploadMessageImage(imageFile);
        if (!image_url && !message.trim()) {
          toast.error(t("Failed to upload image", "图片上传失败"));
          return false;
        }
      }
      
      // Insert the message with the optional image URL
      const { error } = await supabase
        .from('user_messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          message: message.trim(),
          image_url
        });
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("Failed to send message", "发送消息失败"));
      return false;
    } finally {
      setSending(false);
    }
  }, [user, t, sending, uploadMessageImage]);

  // Optimized unsend message function to prevent UI freezes
  const unsendMessage = useCallback(async (messageId: string) => {
    if (!user) return false;
    
    try {
      // First update local state to provide immediate feedback
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                message: t("[This message was unsent]", "[此消息已撤回]"), 
                image_url: null,
                is_unsent: true
              } 
            : msg
        )
      );
      
      // Then update the database
      const { error } = await supabase
        .from('user_messages')
        .update({ 
          message: t("[This message was unsent]", "[此消息已撤回]"), 
          image_url: null 
        })
        .eq('id', messageId)
        .eq('sender_id', user.id); // Ensure only the sender can unsend
      
      if (error) {
        console.error("Error unsending message:", error);
        
        // Revert local state if database update failed
        const firstMsg = setMessages(prev => {
          // Get the first message to extract the receiver_id
          const firstMsg = prev[0];
          return prev;
        })[0];
        
        if (firstMsg) {
          const partnerId = firstMsg.receiver_id === user.id ? firstMsg.sender_id : firstMsg.receiver_id;
          fetchMessages(partnerId);
        }
        
        toast.error(t("Failed to unsend message", "撤回消息失败"));
        return false;
      }
      
      toast.success(t("Message unsent", "消息已撤回"));
      return true;
    } catch (error) {
      console.error("Error unsending message:", error);
      toast.error(t("Failed to unsend message", "撤回消息失败"));
      return false;
    }
  }, [user, t, setMessages, fetchMessages]);
  
  return {
    sending,
    sendMessage,
    unsendMessage
  };
};
