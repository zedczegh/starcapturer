import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  username?: string;
  avatar_url?: string;
}

interface PostCommentsProps {
  postId: string;
  currentUserId?: string;
}

export const PostComments: React.FC<PostCommentsProps> = ({ postId, currentUserId }) => {
  const { t } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const showComments = true; // Always show when rendered

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        const enrichedComments = commentsData.map(comment => ({
          ...comment,
          username: profiles?.find(p => p.id === comment.user_id)?.username || 'User',
          avatar_url: profiles?.find(p => p.id === comment.user_id)?.avatar_url || null
        }));

        setComments(enrichedComments);
      } else {
        setComments([]);
      }
    } catch (error: any) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUserId) {
      toast.error(t('Please login to comment', '请先登录'));
      return;
    }

    if (!newComment.trim()) {
      toast.error(t('Comment cannot be empty', '评论不能为空'));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: currentUserId,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      await loadComments();
      toast.success(t('Comment added', '评论已添加'));
    } catch (error: any) {
      console.error('Comment error:', error);
      toast.error(t('Failed to add comment', '添加评论失败'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="px-4 py-3 space-y-3">
          {/* Comments List */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {comment.avatar_url ? (
                      <AvatarImage src={comment.avatar_url} alt={comment.username} />
                    ) : (
                      <AvatarFallback className="bg-cosmic-800">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-cosmic-800/40 rounded-lg p-2">
                      <p className="text-xs font-semibold text-cosmic-200">{comment.username}</p>
                      <p className="text-sm text-cosmic-100 break-words">{comment.content}</p>
                    </div>
                    <p className="text-xs text-cosmic-400 mt-1 px-2">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-cosmic-400 text-center py-4">
              {t('No comments yet', '暂无评论')}
            </p>
          )}

          {/* Add Comment */}
          {currentUserId && (
            <div className="flex gap-2">
              <Textarea
                placeholder={t('Add a comment...', '添加评论...')}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] bg-cosmic-950/50 border-primary/20 resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <Button
                size="icon"
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                className="flex-shrink-0"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };
