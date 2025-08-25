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
    imageFile: File | null = null, 
    parentId?: string | null
  ): Promise<{ success: boolean, comments?: Comment[] }> => {
    if (!authUser) {
      toast.error(t("You must be logged in to comment", "您必须登录才能评论"));
      return { success: false };
    }
    
    // Validate that there is either text or images
    if (!content.trim() && !imageFile) {
      toast.error(t("Please enter a comment or attach an image", "请输入评论或附加图片"));
      return { success: false };
    }
    
    setCommentSending(true);
    
    try {
      const userId = authUser.id;
      
      console.log("=== SIMPLE COMMENT FLOW (LIKE MESSAGES) ===");
      console.log("1. Starting comment submission");
      console.log("   - Content:", content);
      console.log("   - ImageFile:", imageFile ? `${imageFile.name} (${imageFile.size} bytes)` : 'none');
      console.log("   - ParentId:", parentId);
      console.log("   - UserId:", userId);
      console.log("   - SpotId:", spotId);
      
      let imageUrl: string | null = null;
      
      // Upload image if provided (like messages)
      if (imageFile) {
        console.log("2. Uploading image...");
        const { useMessageUpload } = await import('@/hooks/messaging/useMessageUpload');
        // Use the hook properly
        const uploadHook = useMessageUpload();
        
        try {
          imageUrl = await uploadHook.uploadMessageImage(imageFile);
          console.log("   - Upload result:", imageUrl);
        } catch (uploadError) {
          console.error("   - Upload failed:", uploadError);
          toast.error(t("Failed to upload image", "图片上传失败"));
          return { success: false };
        }
        
        if (!imageUrl) {
          console.error("   - No URL returned from upload");
          toast.error(t("Failed to upload image", "图片上传失败"));
          return { success: false };
        }
      } else {
        console.log("2. No image to upload");
      }
      
      console.log("3. Creating comment in database");
      console.log("   - Final image URL:", imageUrl);
      
      // Create the comment with single image URL (like messages)
      const imageUrls = imageUrl ? [imageUrl] : null;
      const success = await createComment(userId, spotId, content, imageUrls, parentId);
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
      const updatedComments = await fetchComments(spotId);
      console.log("   - Retrieved comments count:", updatedComments.length);
      setComments(updatedComments);
      
      toast.success(parentId 
        ? t("Reply posted!", "回复已发表！") 
        : t("Comment posted!", "评论已发表！")
      );
      
      console.log("6. SUCCESS: Simple comment flow completed");
      console.log("=== SIMPLE COMMENT FLOW END ===");
      return { success: true, comments: updatedComments };
      
    } catch (err) {
      console.error("=== COMMENT FLOW EXCEPTION ===");
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