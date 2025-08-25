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
      
      console.log("=== COMPLETE COMMENT FLOW TRACE ===");
      console.log("1. Starting comment submission");
      console.log("   - Content:", content);
      console.log("   - ImageFiles count:", imageFiles.length);
      console.log("   - Pre-uploaded imageUrls:", imageUrls);
      console.log("   - ParentId:", parentId);
      console.log("   - UserId:", userId);
      console.log("   - SpotId:", spotId);
      
      let finalImageUrls: string[] = [...imageUrls];
      
      // Only upload if we have files and no URLs (URLs means images were already uploaded)
      if (imageFiles.length > 0 && imageUrls.length === 0) {
        console.log("2. Need to upload images first");
        console.log("   - Starting image upload process...");
        
        // Check if storage is accessible
        const bucketReady = await ensureCommentImagesBucket();
        if (!bucketReady) {
          console.error("   - FAILED: Storage bucket is not accessible");
          toast.error(t("Failed to access storage. Please try again later.", "无法访问存储。请稍后再试。"));
          return { success: false };
        }
        
        console.log("   - Storage bucket is ready, uploading files...");
        const uploadedUrls = await uploadCommentImages(imageFiles, t);
        console.log("   - Upload completed. Result URLs:", uploadedUrls);
        console.log("   - Upload success count:", uploadedUrls.length, "out of", imageFiles.length);
        
        if (uploadedUrls.length === 0) {
          console.error("   - FAILED: No URLs returned from upload");
          toast.error(t("Failed to upload images", "图片上传失败"));
          return { success: false };
        }
        
        finalImageUrls = uploadedUrls;
        console.log("   - SUCCESS: Images uploaded, final URLs:", finalImageUrls);
      } else if (imageUrls.length > 0) {
        console.log("2. Using pre-uploaded image URLs");
        console.log("   - Pre-uploaded URLs:", imageUrls);
      } else {
        console.log("2. No images to process");
      }
      
      console.log("3. Creating comment in database");
      console.log("   - Final image URLs to save:", finalImageUrls);
      console.log("   - URLs array length:", finalImageUrls.length);
      console.log("   - URLs array content:", JSON.stringify(finalImageUrls));
      
      // Create the comment with all image URLs
      const success = await createComment(userId, spotId, content, finalImageUrls.length > 0 ? finalImageUrls : null, parentId);
      console.log("4. Database creation result:", success);
      
      if (!success) {
        console.error("   - FAILED: Database creation failed");
        toast.error(parentId 
          ? t("Failed to post reply.", "回复发送失败。") 
          : t("Failed to post comment.", "评论发送失败。")
        );
        return { success: false };
      }
      
      console.log("5. Refreshing comments from database");
      // Immediately fetch updated comments to refresh the UI
      const updatedComments = await fetchComments(spotId);
      console.log("   - Retrieved comments count:", updatedComments.length);
      if (updatedComments.length > 0) {
        console.log("   - First comment has image_urls:", updatedComments[0]?.image_urls);
        console.log("   - First comment has image_url:", updatedComments[0]?.image_url);
      }
      setComments(updatedComments); // Update local state immediately
      
      toast.success(parentId 
        ? t("Reply posted!", "回复已发表！") 
        : t("Comment posted!", "评论已发表！")
      );
      
      console.log("6. SUCCESS: Comment flow completed successfully");
      console.log("=== COMPLETE COMMENT FLOW TRACE END ===");
      return { success: true, comments: updatedComments };
      
    } catch (err) {
      console.error("=== COMMENT FLOW EXCEPTION ===");
      console.error("Exception when posting comment:", err);
      console.error("Exception details:", err instanceof Error ? err.message : String(err));
      console.error("Exception stack:", err instanceof Error ? err.stack : 'No stack');
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