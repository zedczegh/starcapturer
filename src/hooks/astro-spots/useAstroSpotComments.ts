
import { useState, useCallback, useEffect } from 'react';
import { toast } from "sonner";
import { Comment } from '@/components/astro-spots/profile/types/comments';
import { uploadCommentImage, ensureCommentImagesBucket } from '@/utils/comments/commentImageUtils';
import { fetchComments, createComment } from '@/services/comments/commentService';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useAstroSpotComments = (spotId: string, t: (key: string, fallback: string) => string) => {
  const [commentSending, setCommentSending] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [bucketAvailable, setBucketAvailable] = useState<boolean | null>(null);
  const { user: authUser } = useAuth();

  // Check if bucket exists when hook is first used or when user changes
  useEffect(() => {
    const checkStorage = async () => {
      try {
        console.log("Checking comment images bucket availability...");
        // First verify authentication
        const { data: authStatus } = await supabase.auth.getSession();
        
        if (!authStatus.session) {
          console.log("No active session, bucket not accessible");
          setBucketAvailable(false);
          return;
        }
        
        const available = await ensureCommentImagesBucket();
        console.log(`Comment images bucket available: ${available}`);
        setBucketAvailable(available);
        if (!available) {
          console.error("Comment images storage is not accessible - this will affect image uploads");
        }
      } catch (err) {
        console.error("Error checking comment image storage:", err);
        setBucketAvailable(false);
      }
    };
    
    if (authUser) {
      checkStorage();
    } else {
      setBucketAvailable(false);
    }
  }, [authUser]);

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
    
    // Always require text content
    if (!content.trim()) {
      toast.error(t("Please enter a comment", "请输入评论"));
      return { success: false };
    }
    
    setCommentSending(true);
    
    try {
      console.log("Starting comment submission process...");
      const userId = authUser.id;
      
      let imageUrl: string | null = null;
      if (imageFile) {
        // Before upload, verify authentication status
        const { data: authData } = await supabase.auth.getSession();
        if (!authData.session) {
          toast.error(t("You must be logged in to upload images", "您必须登录才能上传图片"));
          setCommentSending(false);
          return { success: false };
        }
        
        // Force a fresh check of bucket availability
        console.log("Verifying bucket availability before upload...");
        const isAvailable = await ensureCommentImagesBucket();
        setBucketAvailable(isAvailable);
        
        if (!isAvailable) {
          toast.error(t("Image uploads are temporarily unavailable", "图片上传暂时不可用"));
          console.error("Image upload skipped because storage bucket is not available");
        } else {
          console.log("Bucket is available, proceeding with upload");
          imageUrl = await uploadCommentImage(imageFile, t);
          
          if (!imageUrl) {
            toast.warning(t("Image couldn't be uploaded, posting text only", "图片无法上传，仅发布文字"));
            console.error("Upload failed despite bucket being available");
          } else {
            console.log("Image uploaded successfully:", imageUrl);
          }
        }
      }
      
      console.log(`Creating comment with content: "${content.substring(0, 20)}..." and imageUrl: ${imageUrl ? "yes" : "no"}`);
      const success = await createComment(userId, spotId, content, imageUrl, parentId);
      
      if (!success) {
        toast.error(parentId 
          ? t("Failed to post reply.", "回复发送失败。") 
          : t("Failed to post comment.", "评论发送失败。")
        );
        return { success: false };
      }
      
      // Immediately fetch updated comments
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
