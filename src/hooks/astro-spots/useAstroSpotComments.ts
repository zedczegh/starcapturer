
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Comment } from '@/components/astro-spots/profile/types/comments';
import { uploadCommentImage } from '@/utils/comments/commentImageUtils';
import { fetchComments, createComment } from '@/services/comments/commentService';

export const useAstroSpotComments = (spotId: string, t: (key: string, fallback: string) => string) => {
  const [commentSending, setCommentSending] = useState(false);

  const submitComment = async (
    content: string, 
    imageFile: File | null, 
    parentId?: string | null
  ): Promise<{ success: boolean, comments?: Comment[] }> => {
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
        imageUrl = await uploadCommentImage(imageFile, t);
        if (!imageUrl) {
          toast.error(t("Failed to upload image", "图片上传失败"));
          return { success: false };
        }
      }
      
      const success = await createComment(userId, spotId, content, imageUrl, parentId);
      
      if (!success) {
        toast.error(parentId ? t("Failed to post reply.", "回复发送失败。") : t("Failed to post comment.", "评论发送失败。"));
        return { success: false };
      }
      
      // Fetch updated comments
      const comments = await fetchComments(spotId);
      
      toast.success(parentId ? t("Reply posted!", "回复已发表！") : t("Comment posted!", "评论已发表！"));
      return { success: true, comments };
      
    } catch (err) {
      console.error("Exception when posting comment:", err);
      toast.error(parentId ? t("Failed to post reply.", "回复发送失败。") : t("Failed to post comment.", "评论发送失败。"));
      return { success: false };
    } finally {
      setCommentSending(false);
    }
  };

  return {
    commentSending,
    submitComment,
    fetchComments: () => fetchComments(spotId)
  };
};

export default useAstroSpotComments;
