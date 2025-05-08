
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { uploadCommentImage } from '@/utils/comments/commentImageUtils';

export type Comment = {
  id: string;
  comment: string;
  created_at: string;
  astro_spot_id: string;
  user_id: string;
  image_url?: string | null;
  parent_id?: string | null;
  profiles?: {
    username: string | null;
    avatar_url?: string | null;
    full_name?: string | null;
  };
  replies?: Comment[];
};

export const useAstroSpotComments = (spotId: string, t: (key: string, fallback: string) => string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [commentSending, setCommentSending] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!spotId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('astro_spot_comments')
        .select(`
          *,
          profiles:user_id (username, avatar_url, full_name)
        `)
        .eq('spot_id', spotId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching comments:', error);
        toast.error(t('Failed to load comments', '加载评论失败'));
        return;
      }
      
      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        data.map(async (comment) => {
          const { data: replies, error: repliesError } = await supabase
            .from('astro_spot_comments')
            .select(`
              *,
              profiles:user_id (username, avatar_url, full_name)
            `)
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });
            
          if (repliesError) {
            console.error('Error fetching replies:', repliesError);
            return { ...comment, replies: [] };
          }
          
          // Map the comment data to our Comment type
          return {
            ...comment,
            replies: replies?.map(reply => ({
              id: reply.id,
              comment: reply.content,
              created_at: reply.created_at,
              astro_spot_id: reply.spot_id,
              user_id: reply.user_id,
              image_url: reply.image_url,
              parent_id: reply.parent_id,
              profiles: reply.profiles
            })) || []
          };
        })
      );
      
      // Map the data to match our Comment type
      const typedComments: Comment[] = commentsWithReplies.map(comment => ({
        id: comment.id,
        comment: comment.content,
        created_at: comment.created_at,
        astro_spot_id: comment.spot_id,
        user_id: comment.user_id,
        image_url: comment.image_url,
        parent_id: comment.parent_id,
        profiles: comment.profiles,
        replies: comment.replies
      }));
      
      setComments(typedComments);
    } catch (err) {
      console.error('Exception fetching comments:', err);
      toast.error(t('Failed to load comments', '加载评论失败'));
    } finally {
      setLoading(false);
    }
  }, [spotId, t]);

  const submitComment = useCallback(async (
    content: string, 
    imageFile: File | null = null, 
    parentId?: string | null
  ) => {
    if (!spotId || (!content.trim() && !imageFile)) return null;
    
    try {
      setCommentSending(true);
      let image_url = null;
      
      if (imageFile) {
        setUploadingImage(true);
        image_url = await uploadCommentImage(imageFile, t);
        setUploadingImage(false);
        
        // If image upload fails but we have text, continue with text-only comment
        if (!image_url && !content.trim()) {
          toast.error(t('Failed to upload image', '图片上传失败'));
          setCommentSending(false);
          return null;
        }
      }
      
      const { data, error } = await supabase
        .from('astro_spot_comments')
        .insert([
          { 
            content: content.trim(), 
            spot_id: spotId, 
            user_id: (await supabase.auth.getUser()).data.user?.id,
            image_url,
            parent_id: parentId || null
          }
        ])
        .select(`
          *,
          profiles:user_id (username, avatar_url, full_name)
        `)
        .single();
        
      if (error) {
        console.error('Error adding comment:', error);
        toast.error(t('Failed to add comment', '添加评论失败'));
        return null;
      }
      
      // Convert the returned data to our Comment type
      const newComment: Comment = {
        id: data.id,
        comment: data.content,
        created_at: data.created_at,
        astro_spot_id: data.spot_id,
        user_id: data.user_id,
        image_url: data.image_url,
        parent_id: data.parent_id,
        profiles: data.profiles,
        replies: []
      };
      
      // Update comments state
      if (parentId) {
        setComments(prevComments => 
          prevComments.map(c => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newComment]
              };
            }
            return c;
          })
        );
      } else {
        setComments(prev => [newComment, ...prev]);
      }
      
      return newComment;
    } catch (err) {
      console.error('Exception adding comment:', err);
      toast.error(t('Failed to add comment', '添加评论失败'));
      return null;
    } finally {
      setCommentSending(false);
      setUploadingImage(false);
    }
  }, [spotId, t]);

  return {
    comments,
    loading,
    uploadingImage,
    commentSending,
    fetchComments,
    submitComment
  };
};

export default useAstroSpotComments;
