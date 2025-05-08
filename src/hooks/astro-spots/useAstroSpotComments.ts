
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
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user: authUser } = useAuth();

  // Check bucket access when hook is first used - with optimized caching
  useEffect(() => {
    const checkStorage = async () => {
      try {
        // Check for cached result to avoid unnecessary api calls
        const cachedResult = sessionStorage.getItem('commentImagesBucketAvailable');
        if (cachedResult) {
          const isAvailable = cachedResult === 'true';
          setStorageChecked(true);
          console.log("Using cached comment images storage status:", isAvailable);
          return;
        }
        
        const available = await ensureCommentImagesBucket();
        setStorageChecked(true);
        
        // Cache the result for 30 minutes
        sessionStorage.setItem('commentImagesBucketAvailable', String(available));
        
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

  // Load comments function with better error handling and preloading
  const loadComments = useCallback(async () => {
    try {
      console.log(`Loading comments for spot: ${spotId}`);
      const fetchedComments = await fetchComments(spotId);
      console.log(`Loaded ${fetchedComments.length} comments`);
      setComments(fetchedComments);
      setLoaded(true);
      
      // Preload comment images for better mobile experience
      setTimeout(() => {
        fetchedComments.forEach(comment => {
          if (comment.imageUrl) {
            const img = new Image();
            img.src = comment.imageUrl;
          }
        });
      }, 1000);
      
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
      
      // Handle image upload separately if there is an image
      if (imageFile) {
        setImageUploading(true);
        setUploadProgress(10);
        try {
          // Simulate progress updates for better UX on mobile
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
          }, 500);
          
          // Check if bucket exists and is accessible
          const bucketReady = await ensureCommentImagesBucket();
          if (!bucketReady) {
            toast.error(t("Image upload is not available at this time", "图片上传功能暂时不可用"));
            clearInterval(progressInterval);
            
            // Continue without the image if we have text content
            if (!content.trim()) {
              setCommentSending(false);
              setImageUploading(false);
              setUploadProgress(0);
              return { success: false };
            }
            // Proceed with just the text content
          } else {
            // Try to upload the image with better error handling
            imageUrl = await uploadCommentImage(imageFile, t);
            clearInterval(progressInterval);
            setUploadProgress(100);
            
            if (!imageUrl) {
              // Log the error but continue with the comment if we have text
              console.warn("Failed to upload image, proceeding with text-only comment");
              if (content.trim()) {
                toast.warning(t("Failed to upload image. Posting comment without image.", "图片上传失败。发布不含图片的评论。"));
              } else {
                setCommentSending(false);
                setImageUploading(false);
                setUploadProgress(0);
                toast.error(t("Failed to upload image and no text provided.", "图片上传失败，且未提供文本。"));
                return { success: false };
              }
            }
          }
        } finally {
          setImageUploading(false);
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
      setUploadProgress(0);
      
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
      setUploadProgress(0);
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
    storageChecked,
    imageUploading,
    uploadProgress
  };
};

export default useAstroSpotComments;
