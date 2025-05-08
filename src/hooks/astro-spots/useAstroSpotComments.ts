
import { useState, useCallback, useEffect } from 'react';
import { toast } from "sonner";
import { Comment } from '@/components/astro-spots/profile/types/comments';
import { uploadCommentImage, ensureCommentImagesBucket } from '@/utils/comments/commentImageUtils';
import { fetchComments, createComment } from '@/services/comments/commentService';
import { useAuth } from "@/contexts/AuthContext";

export const useAstroSpotComments = (spotId: string, t: (key: string, fallback: string) => string) => {
  const [commentSending, setCommentSending] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [bucketAvailable, setBucketAvailable] = useState<boolean | null>(null);
  const { user: authUser } = useAuth();

  // Check if bucket exists when hook is first used
  useEffect(() => {
    const checkStorage = async () => {
      try {
        const available = await ensureCommentImagesBucket();
        setBucketAvailable(available);
        if (!available) {
          console.log("Comment images storage is not accessible - this will affect image uploads");
        }
      } catch (err) {
        console.error("Error checking comment image storage:", err);
        setBucketAvailable(false);
      }
    };
    checkStorage();
  }, []);

  // Load comments function with better error handling
  const loadComments = useCallback(async () => {
    try {
      console.log(`Loading comments for spot: ${spotId}`);
      const fetchedComments = await fetchComments(spotId);
      console.log(`Loaded ${fetchedComments.length} comments`);
      setComments(fetchedComments);
      setLoaded(true);
      return fetchedComments;
    } catch (err) {
      console.error("Error loading comments:", err);
      setLoaded(true);
      return [] as Comment[];
    }
  }, [spotId]);

  const submitComment = async (
    content: string, 
    imageFile: File | null, 
    parentId?: string | null
  ): Promise<{ success: boolean, comments?: Comment[] }> => {
    if (!authUser) {
      toast.error(t("You must be logged in to comment", "您必须登录才能评论"));
      return { success: false };
    }
    
    // Always require text content (even with an image)
    if (!content.trim()) {
      toast.error(t("Please enter a comment", "请输入评论"));
      return { success: false };
    }
    
    setCommentSending(true);
    
    try {
      const userId = authUser.id;
      
      let imageUrl: string | null = null;
      if (imageFile) {
        // Check if bucket is available before trying to upload
        if (bucketAvailable === false) {
          toast.error(t("Image uploads are temporarily unavailable", "图片上传暂时不可用"));
          console.log("Image upload skipped because storage bucket is not available");
        } else {
          console.log("Uploading image for comment...");
          imageUrl = await uploadCommentImage(imageFile, t);
          if (!imageUrl) {
            // Continue with text-only comment if image upload fails
            toast.warning(t("Image couldn't be uploaded, posting text only", "图片无法上传，仅发布文字"));
          }
        }
      }
      
      const success = await createComment(userId, spotId, content, imageUrl, parentId);
      
      if (!success) {
        toast.error(parentId 
          ? t("Failed to post reply.", "回复发送失败。") 
          : t("Failed to post comment.", "评论发送失败。")
        );
        return { success: false };
      }
      
      // Immediately fetch updated comments to refresh the UI
      const updatedComments = await fetchComments(spotId);
      setComments(updatedComments); // Update local state immediately
      
      toast.success(parentId 
        ? t("Reply posted!", "回复已发表！") 
        : t("Comment posted!", "评论已发表！")
      );
      
      return { success: true, comments: updatedComments };
      
    } catch (err) {
      console.error("Exception when posting comment:", err);
      toast.error(parentId 
        ? t("Failed to post reply.", "回复发送失败。") 
        : t("Failed to post comment.", "评论发送失败。")
      );
      return { success: false };
    } finally {
      setCommentSending(false);
    }
  };

  return {
    commentSending,
    comments,
    loaded,
    bucketAvailable,
    submitComment,
    fetchComments: loadComments
  };
};

export default useAstroSpotComments;
