
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
  const [storageChecked, setStorageChecked] = useState(false);
  const { user: authUser } = useAuth();

  // Check bucket access when hook is first used
  useEffect(() => {
    const checkStorage = async () => {
      try {
        const available = await ensureCommentImagesBucket();
        setStorageChecked(true);
        if (!available) {
          console.log("Comment images storage is not accessible. Image uploads may not work.");
        } else {
          console.log("Comment images storage is ready for use");
        }
      } catch (err) {
        console.error("Error checking comment image storage:", err);
        setStorageChecked(true);
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
    
    // Always require text content with an image
    if (imageFile && !content.trim()) {
      toast.error(t("Please add some text with your image", "请为您的图片添加一些文字"));
      return { success: false };
    }
    
    // Validate that there is either text or image
    if (!content.trim() && !imageFile) {
      toast.error(t("Please enter a comment or attach an image", "请输入评论或附加图片"));
      return { success: false };
    }
    
    setCommentSending(true);
    
    try {
      const userId = authUser.id;
      
      let imageUrl: string | null = null;
      if (imageFile) {
        // Check if bucket exists and is accessible
        const bucketReady = await ensureCommentImagesBucket();
        if (!bucketReady) {
          toast.error(t("Image upload is not available at this time. Please try again later or post without an image.", 
                       "图片上传功能暂时不可用。请稍后再试或发布不含图片的评论。"));
          
          // Continue without the image if we have text content
          if (!content.trim()) {
            setCommentSending(false);
            return { success: false };
          }
          // Proceed with just the text content
        } else {
          // Try to upload the image
          imageUrl = await uploadCommentImage(imageFile, t);
          if (!imageUrl) {
            // Log the error but continue with the comment if we have text
            console.warn("Failed to upload image, proceeding with text-only comment");
            if (content.trim()) {
              toast.warning(t("Failed to upload image. Posting comment without image.", "图片上传失败。发布不含图片的评论。"));
            } else {
              setCommentSending(false);
              toast.error(t("Failed to upload image and no text provided.", "图片上传失败，且未提供文本。"));
              return { success: false };
            }
          }
        }
      }
      
      // Create the comment
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

  // Run loadComments on mount and when spotId changes
  useEffect(() => {
    if (spotId) {
      loadComments();
    }
  }, [spotId, loadComments]);

  return {
    commentSending,
    comments,
    loaded,
    submitComment,
    fetchComments: loadComments,
    storageChecked
  };
};

export default useAstroSpotComments;
