
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export const useMessageActions = (fetchMessages: Function, setMessages: Function) => {
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  const sendMessage = async (text: string, imageFile?: File | null, locationData?: any) => {
    if (!user) return;
    
    setSending(true);
    
    try {
      // Simulate sending a message (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create message object
      const message = {
        id: `msg-${Date.now()}`,
        sender_id: user.id,
        text: text,
        image_url: imageFile ? URL.createObjectURL(imageFile) : null,
        location: locationData || null,
        created_at: new Date().toISOString(),
      };
      
      // Update messages in state first for optimistic UI update
      setMessages((prevMessages: any[]) => [...prevMessages, message]);
      
      // In a real app, send to backend API here
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("Failed to send message", "发送消息失败"));
    } finally {
      setSending(false);
    }
  };

  const unsendMessage = async (messageId: string) => {
    if (!messageId) return false;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update local state
      setMessages((prevMessages: any[]) => 
        prevMessages.filter(msg => msg.id !== messageId)
      );
      
      // In a real app, send to backend API here
      
      return true;
    } catch (error) {
      console.error("Error unsending message:", error);
      toast.error(t("Failed to unsend message", "撤回消息失败"));
      return false;
    }
  };

  return { sending, sendMessage, unsendMessage };
};
