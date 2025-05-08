
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  image_url?: string | null;
  created_at: string;
  read: boolean;
  sender_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
  is_unsent?: boolean;
}

interface ConversationPartner {
  id: string;
  username: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export function useMessaging() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<ConversationPartner[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Check if message_images bucket is accessible
  const ensureMessageImagesBucket = async (): Promise<boolean> => {
    try {
      console.log("Checking if message_images bucket exists...");
      
      // Check bucket existence by attempting a list operation
      const { error } = await supabase.storage
        .from('message_images')
        .list('');
        
      if (error) {
        console.error("Error checking message_images bucket:", error);
        return false;
      }
      
      // If we got here, the bucket exists and we have permissions
      console.log("message_images bucket is available");
      return true;
    } catch (error) {
      console.error("Exception checking message_images bucket:", error);
      return false;
    }
  };

  // Upload image for message
  const uploadMessageImage = async (imageFile: File): Promise<string | null> => {
    if (!imageFile) return null;
    
    // Check if bucket is accessible
    const bucketReady = await ensureMessageImagesBucket();
    if (!bucketReady) {
      console.error("Message images bucket is not accessible");
      toast.error(t("Failed to access storage", "无法访问存储"));
      return null;
    }
    
    try {
      // Generate a unique filename
      const uniqueId = uuidv4();
      const fileExt = imageFile.name.split('.').pop() || '';
      const sanitizedExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
      const fileName = `${uniqueId}-${sanitizedExt}`;
      
      console.log("Uploading message image with filename:", fileName);
      
      // Upload the image to the bucket
      const { error: uploadError } = await supabase.storage
        .from('message_images')
        .upload(fileName, imageFile, {
          contentType: imageFile.type,
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error("Error uploading message image:", uploadError);
        return null;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('message_images')
        .getPublicUrl(fileName);
      
      if (!publicUrlData?.publicUrl) {
        console.error("Failed to get public URL for message image");
        return null;
      }
      
      console.log("Message image uploaded successfully, public URL:", publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("Exception during message image upload:", err);
      return null;
    }
  };

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('user_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const uniqueUserIds = new Set<string>();
      messagesData.forEach(msg => {
        if (msg.sender_id !== user.id) uniqueUserIds.add(msg.sender_id);
        if (msg.receiver_id !== user.id) uniqueUserIds.add(msg.receiver_id);
      });

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(uniqueUserIds));

      if (profilesError) throw profilesError;

      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      const conversationsMap = new Map<string, ConversationPartner>();

      messagesData.forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationsMap.has(partnerId)) {
          const profile = profilesMap.get(partnerId);
          conversationsMap.set(partnerId, {
            id: partnerId,
            username: profile?.username || "User",
            avatar_url: profile?.avatar_url || null,
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: msg.sender_id !== user.id && !msg.read ? 1 : 0
          });
        } else {
          const existingConv = conversationsMap.get(partnerId);
          const msgTime = new Date(msg.created_at).getTime();
          const existingTime = new Date(existingConv.last_message_time).getTime();
          
          if (msgTime > existingTime) {
            existingConv.last_message = msg.message;
            existingConv.last_message_time = msg.created_at;
          }
          
          if (msg.sender_id !== user.id && !msg.read) {
            existingConv.unread_count += 1;
          }
        }
      });

      setConversations(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error(t("Failed to load conversations", "加载对话失败"));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  const fetchMessages = useCallback(async (partnerId: string) => {
    if (!user || !partnerId) return;

    try {
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const senderIds = data?.map(msg => msg.sender_id) || [];
      const uniqueSenderIds = [...new Set(senderIds)];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', uniqueSenderIds);
        
      if (profilesError) throw profilesError;
      
      const messagesWithProfiles = data?.map(msg => {
        const senderProfile = profilesData?.find(profile => profile.id === msg.sender_id);
        return {
          ...msg,
          sender_profile: {
            username: senderProfile?.username || "User",
            avatar_url: senderProfile?.avatar_url
          }
        };
      });
      
      setMessages(messagesWithProfiles || []);

      // Mark messages as read
      const unreadMessages = data?.filter(msg => !msg.read && msg.sender_id === partnerId);
      if (unreadMessages && unreadMessages.length > 0) {
        await Promise.all(unreadMessages.map(msg => 
          supabase
            .from('user_messages')
            .update({ read: true })
            .eq('id', msg.id)
        ));
        
        setConversations(prev => 
          prev.map(conv => 
            conv.id === partnerId ? { ...conv, unread_count: 0 } : conv
          )
        );
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error(t("Failed to load messages", "加载消息失败"));
    }
  }, [user, t]);

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
        fetchMessages(messages[0]?.receiver_id || messages[0]?.sender_id);
        
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
  }, [user, messages, t, fetchMessages]);

  useEffect(() => {
    if (!user) return;
    
    fetchConversations();

    const channel = supabase
      .channel('messages_channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_messages',
          filter: `receiver_id=eq.${user.id}`
        }, 
        () => {
          fetchConversations();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    sending,
    fetchMessages,
    sendMessage,
    unsendMessage,
  };
}
