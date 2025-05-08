
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { uploadCommentImage } from '@/utils/comments/commentImageUtils';
import { Comment } from '@/components/astro-spots/profile/types/comments';

export type CommentResponse = {
  id: string;
  comment: string;
  created_at: string;
  astro_spot_id: string;
  user_id: string;
  image_url?: string | null;
  parent_id?: string | null;
  profiles?: any;
  replies?: CommentResponse[];
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
          
          // Transform replies to match our Comment type
          const typedReplies: Comment[] = replies?.map(reply => ({
            id: reply.id,
            content: reply.content,
            created_at: reply.created_at,
            image_url: reply.image_url,
            parent_id: reply.parent_id,
            // Handle potentially missing profiles data
            profiles: isValidProfile(reply.profiles) ? {
              username: reply.profiles.username || "Anonymous",
              avatar_url: reply.profiles.avatar_url || null,
              full_name: reply.profiles.full_name || null
            } : null
          })) || [];
          
          return {
            ...comment,
            replies: typedReplies
          };
        })
      );
      
      // Transform the data to match our Comment type with proper handling for profiles
      const typedComments: Comment[] = commentsWithReplies.map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        image_url: comment.image_url,
        parent_id: comment.parent_id,
        // Ensure profiles is properly typed with null handling
        profiles: isValidProfile(comment.profiles) ? {
          username: comment.profiles.username || "Anonymous",
          avatar_url: comment.profiles.avatar_url || null,
          full_name: comment.profiles.full_name || null
        } : null,
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

  // Helper function to validate profile data
  const isValidProfile = (profile: any): boolean => {
    return profile && typeof profile === 'object' && !profile.error;
  };

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
      
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) {
        toast.error(t('You must be logged in to comment', '您必须登录才能评论'));
        setCommentSending(false);
        return null;
      }
      
      const { data, error } = await supabase
        .from('astro_spot_comments')
        .insert([
          { 
            content: content.trim(), 
            spot_id: spotId,
            user_id: currentUser.id,
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
      
      // Convert the returned data to our Comment type with proper null handling
      const newComment: Comment = {
        id: data.id,
        content: data.content,
        created_at: data.created_at,
        image_url: data.image_url,
        parent_id: data.parent_id,
        // Ensure profiles is properly typed with null handling
        profiles: isValidProfile(data.profiles) ? {
          username: data.profiles.username || "Anonymous",
          avatar_url: data.profiles.avatar_url || null,
          full_name: data.profiles.full_name || null
        } : null,
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
