
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { Comment } from '@/components/astro-spots/profile/types/comments';

export const useAstroSpotComments = (spotId: string, t: (key: string, fallback: string) => string) => {
  const [commentSending, setCommentSending] = useState(false);

  const ensureCommentBucket = async (): Promise<boolean> => {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'comment_images');
      
      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket('comment_images', {
          public: true
        });
        
        if (error) {
          console.error("Error creating comment_images bucket:", error);
          return false;
        }
        console.log("Created comment_images bucket");
      }
      return true;
    } catch (error) {
      console.error("Error checking/creating bucket:", error);
      return false;
    }
  };

  const uploadImage = async (imageFile: File): Promise<string | null> => {
    // Ensure bucket exists
    const bucketReady = await ensureCommentBucket();
    if (!bucketReady) {
      toast.error(t("Failed to prepare storage", "存储准备失败"));
      return null;
    }
    
    // Create a simple filename (avoid using uuid directly as filename)
    const uniqueId = uuidv4();
    const fileExt = imageFile.name.split('.').pop() || '';
    const fileName = `${uniqueId}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('comment_images')
      .upload(fileName, imageFile, {
        contentType: imageFile.type,
        cacheControl: '3600'
      });
      
    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      toast.error(t("Failed to upload image", "图片上传失败"));
      return null;
    }
    
    // Get the public URL for the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from('comment_images')
      .getPublicUrl(fileName);
    
    return publicUrlData?.publicUrl || null;
  };

  const fetchComments = async (): Promise<Comment[]> => {
    try {
      const { data, error } = await supabase
        .from("astro_spot_comments")
        .select(`
          id,
          content,
          created_at,
          image_url,
          profiles:profiles!user_id(
            username,
            avatar_url
          )
        `)
        .eq('spot_id', spotId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        image_url: comment.image_url,
        profiles: comment.profiles || { username: null, avatar_url: null }
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      return [];
    }
  };

  const submitComment = async (content: string, imageFile: File | null): Promise<{ success: boolean, comments?: Comment[] }> => {
    setCommentSending(true);
    
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        toast.error(t("You must be logged in to comment", "您必须登录才能评论"));
        return { success: false };
      }
      
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) return { success: false };
      }
      
      const { error } = await supabase
        .from("astro_spot_comments")
        .insert({
          user_id: userId,
          spot_id: spotId,
          content: content.trim() || " ", // Use a space if only image is submitted
          image_url: imageUrl
        });
      
      if (error) {
        console.error("Error posting comment:", error);
        toast.error(t("Failed to post comment.", "评论发送失败。"));
        return { success: false };
      }
      
      // Fetch updated comments
      const comments = await fetchComments();
      
      toast.success(t("Comment posted!", "评论已发表！"));
      return { success: true, comments };
      
    } catch (err) {
      console.error("Exception when posting comment:", err);
      toast.error(t("Failed to post comment.", "评论发送失败。"));
      return { success: false };
    } finally {
      setCommentSending(false);
    }
  };

  return {
    commentSending,
    submitComment,
    fetchComments
  };
};

export default useAstroSpotComments;
