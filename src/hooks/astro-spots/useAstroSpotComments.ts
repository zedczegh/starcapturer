
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadCommentImage } from '@/utils/comments/commentImageUtils';
import { Comment } from '@/components/astro-spots/profile/types/comments';

export const useAstroSpotComments = (
  spotId: string, 
  t: (key: string, fallback: string) => string,
  noRefresh: boolean = false
) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentSending, setCommentSending] = useState(false);
  const [fetchingComments, setFetchingComments] = useState(false);
  
  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!spotId || fetchingComments) return;
    
    try {
      setFetchingComments(true);
      
      const { data, error } = await supabase
        .from('astro_spot_comments')
        .select(`
          *,
          users:user_id (
            id,
            email,
            display_name,
            avatar_url
          )
        `)
        .eq('spot_id', spotId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching comments:", error);
        return;
      }
      
      const transformedComments: Comment[] = (data || []).map((item: any) => ({
        id: item.id,
        content: item.content,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user_id: item.user_id,
        spot_id: item.spot_id,
        parent_id: item.parent_id,
        image_url: item.image_url,
        user: {
          id: item.users?.id || '',
          email: item.users?.email || '',
          displayName: item.users?.display_name || t('Anonymous', '匿名用户'),
          avatarUrl: item.users?.avatar_url || ''
        }
      }));
      
      setComments(transformedComments);
    } catch (error) {
      console.error("Error in fetch comments:", error);
    } finally {
      setFetchingComments(false);
    }
  }, [spotId, t, fetchingComments]);
  
  // Submit comment
  const submitComment = useCallback(async (
    content: string,
    imageFile: File | null,
    parentId?: string | null
  ) => {
    if (!spotId || commentSending) return;
    
    try {
      setCommentSending(true);
      
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("User not authenticated");
        return;
      }
      
      let imageUrl = null;
      
      // Handle image upload if provided
      if (imageFile) {
        try {
          imageUrl = await uploadCommentImage(imageFile, t);
        } catch (error) {
          console.error("Error uploading image:", error);
        }
      }
      
      // Insert comment
      const { error } = await supabase
        .from('astro_spot_comments')
        .insert({
          content,
          user_id: user.id,
          spot_id: spotId,
          parent_id: parentId || null,
          image_url: imageUrl
        });
      
      if (error) {
        console.error("Error submitting comment:", error);
        return;
      }
      
      // Refresh comments after successful submission
      fetchComments();
      
    } catch (error) {
      console.error("Error in submit comment:", error);
    } finally {
      setCommentSending(false);
    }
  }, [spotId, commentSending, fetchComments, t]);
  
  return {
    comments,
    fetchComments,
    submitComment,
    commentSending
  };
};

export default useAstroSpotComments;
