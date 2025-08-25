
import { useState, useCallback, useEffect } from 'react';
import { toast } from "sonner";
import { Comment } from '@/components/astro-spots/profile/types/comments';
import { deleteComment } from '@/services/comments/commentService';
import { uploadCommentImages, ensureCommentImagesBucket } from '@/utils/comments/commentImageUtils';
import { fetchComments, createComment } from '@/services/comments/commentService';
import { useAuth } from "@/contexts/AuthContext";

export const useAstroSpotComments = (spotId: string, t: (key: string, fallback: string) => string) => {
  const [commentSending, setCommentSending] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storageChecked, setStorageChecked] = useState(false);
  const { user: authUser } = useAuth();

  // Initialize bucket checking when hook is first used - don't try to create it anymore
  useEffect(() => {
    const checkStorage = async () => {
      try {
        const available = await ensureCommentImagesBucket();
        setStorageChecked(true);
        if (!available) {
          console.log("Comment images storage is not accessible. Some features may be limited.");
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
    imageFiles: File[] = [], 
    parentId?: string | null,
    imageUrls: string[] = []
  ): Promise<{ success: boolean, comments?: Comment[] }> => {
    if (!authUser) {
      toast.error(t("You must be logged in to comment", "您必须登录才能评论"));
      return { success: false };
    }
    
    // Validate that there is either text or images
    if (!content.trim() && imageFiles.length === 0 && imageUrls.length === 0) {
      toast.error(t("Please enter a comment or attach an image", "请输入评论或附加图片"));
      return { success: false };
    }
    
    setCommentSending(true);
    
    try {
      const userId = authUser.id;
      
      let finalImageUrls: string[] = [...imageUrls];
      
      console.log("=== HOOK COMMENT DEBUG ===");
      console.log("Initial imageUrls:", imageUrls);
      console.log("ImageFiles count:", imageFiles.length);
      console.log("Initial finalImageUrls:", finalImageUrls);
      
      // Only upload if we have files and no URLs (URLs means images were already uploaded)
      if (imageFiles.length > 0 && imageUrls.length === 0) {
        console.log("Starting image upload process...");
        // Check if storage is accessible
        const bucketReady = await ensureCommentImagesBucket();
        if (!bucketReady) {
          console.error("Storage bucket is not accessible");
          toast.error(t("Failed to access storage. Please try again later.", "无法访问存储。请稍后再试。"));
          return { success: false };
        }
        
        const uploadedUrls = await uploadCommentImages(imageFiles, t);
        console.log("Upload result URLs:", uploadedUrls);
        if (uploadedUrls.length === 0) {
          console.error("No URLs returned from upload");
          toast.error(t("Failed to upload images", "图片上传失败"));
          return { success: false };
        }
        finalImageUrls = uploadedUrls;
        console.log("Final imageUrls after upload:", finalImageUrls);
      }
      
      console.log("About to create comment with URLs:", finalImageUrls);
      console.log("Passing to createComment:", finalImageUrls.length > 0 ? finalImageUrls : null);
      
      // Create the comment with all image URLs
      const success = await createComment(userId, spotId, content, finalImageUrls.length > 0 ? finalImageUrls : null, parentId);
      console.log("Comment creation result:", success);
      console.log("=== HOOK COMMENT DEBUG END ===");
      
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

  const deleteCommentById = async (commentId: string): Promise<{ success: boolean, comments?: Comment[] }> => {
    if (!authUser) {
      toast.error(t("You must be logged in to delete comments", "您必须登录才能删除评论"));
      return { success: false };
    }
    
    try {
      const success = await deleteComment(commentId, authUser.id);
      
      if (!success) {
        toast.error(t("Failed to delete comment.", "删除评论失败。"));
        return { success: false };
      }
      
      // Immediately fetch updated comments to refresh the UI
      const updatedComments = await fetchComments(spotId);
      setComments(updatedComments); // Update local state immediately
      
      toast.success(t("Comment deleted!", "评论已删除！"));
      
      return { success: true, comments: updatedComments };
      
    } catch (err) {
      console.error("Exception when deleting comment:", err);
      toast.error(t("Failed to delete comment.", "删除评论失败。"));
      return { success: false };
    }
  };

  return {
    commentSending,
    comments,
    loaded,
    submitComment,
    fetchComments: loadComments,
    deleteComment: deleteCommentById,
    storageChecked
  };
};

export default useAstroSpotComments;
