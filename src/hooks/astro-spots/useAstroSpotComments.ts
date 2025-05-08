
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
  image_url?: string;
  parent_id?: string;
  profiles?: {
    username: string;
    avatar_url?: string;
    full_name?: string;
  };
  replies?: Comment[];
};

export const useAstroSpotComments = (spotId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { t } = useLanguage();

  const fetchComments = useCallback(async () => {
    if (!spotId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (username, avatar_url, full_name)
        `)
        .eq('astro_spot_id', spotId)
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
            .from('comments')
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
          
          return { ...comment, replies: replies || [] };
        })
      );
      
      setComments(commentsWithReplies);
    } catch (err) {
      console.error('Exception fetching comments:', err);
      toast.error(t('Failed to load comments', '加载评论失败'));
    } finally {
      setLoading(false);
    }
  }, [spotId, t]);

  const addComment = useCallback(async (comment: string, userId: string, imageFile?: File | null, parentId?: string) => {
    if (!spotId || (!comment.trim() && !imageFile)) return null;
    
    try {
      let image_url = null;
      
      if (imageFile) {
        setUploadingImage(true);
        image_url = await uploadCommentImage(imageFile, t);
        setUploadingImage(false);
        
        // If image upload fails but we have text, continue with text-only comment
        if (!image_url && !comment.trim()) {
          toast.error(t('Failed to upload image', '图片上传失败'));
          return null;
        }
      }
      
      const { data, error } = await supabase
        .from('comments')
        .insert([
          { 
            comment: comment.trim(), 
            astro_spot_id: spotId, 
            user_id: userId,
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
      
      // Update comments state
      if (parentId) {
        setComments(prevComments => 
          prevComments.map(c => 
            c.id === parentId 
              ? { ...c, replies: [...(c.replies || []), data] }
              : c
          )
        );
      } else {
        const newComment = { ...data, replies: [] };
        setComments(prev => [newComment, ...prev]);
      }
      
      return data;
    } catch (err) {
      console.error('Exception adding comment:', err);
      toast.error(t('Failed to add comment', '添加评论失败'));
      return null;
    } finally {
      setUploadingImage(false);
    }
  }, [spotId, t]);

  return {
    comments,
    loading,
    uploadingImage,
    fetchComments,
    addComment
  };
};

export default useAstroSpotComments;
