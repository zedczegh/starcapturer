
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { Comment } from '@/components/astro-spots/profile/types/comments';

export const useAstroSpotComments = (spotId: string, t: (key: string, fallback: string) => string) => {
  const [commentSending, setCommentSending] = useState(false);

  const uploadImage = async (imageFile: File): Promise<string | null> => {
    try {
      // Generate a unique filename
      const uniqueId = uuidv4();
      const fileExt = imageFile.name.split('.').pop() || '';
      const sanitizedExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
      const fileName = `${uniqueId}.${sanitizedExt || 'jpg'}`;
      
      console.log("Uploading image with filename:", fileName);
      
      // Upload the image to the existing bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('comment_images')
        .upload(fileName, imageFile, {
          contentType: imageFile.type,
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        toast.error(t("Failed to upload image", "图片上传失败"));
        return null;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('comment_images')
        .getPublicUrl(fileName);
      
      if (!publicUrlData?.publicUrl) {
        console.error("Failed to get public URL for image");
        return null;
      }
      
      console.log("Image uploaded successfully, public URL:", publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("Exception during image upload:", err);
      return null;
    }
  };

  const fetchComments = async (): Promise<Comment[]> => {
    try {
      console.log("Fetching comments for spot ID:", spotId);
      
      const { data, error } = await supabase
        .from("astro_spot_comments")
        .select(`
          id,
          content,
          created_at,
          image_url,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('spot_id', spotId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching comments:", error);
        throw error;
      }
      
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
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user?.id) {
        console.error("Auth error:", userError);
        toast.error(t("You must be logged in to comment", "您必须登录才能评论"));
        return { success: false };
      }
      
      const userId = userData.user.id;
      
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          toast.error(t("Failed to upload image", "图片上传失败"));
          return { success: false };
        }
      }
      
      console.log("Inserting comment for user:", userId, "spot:", spotId);
      
      const { error: insertError } = await supabase
        .from("astro_spot_comments")
        .insert({
          user_id: userId,
          spot_id: spotId,
          content: content.trim() || " ", // Use a space if only image is submitted
          image_url: imageUrl
        });
      
      if (insertError) {
        console.error("Error posting comment:", insertError);
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
