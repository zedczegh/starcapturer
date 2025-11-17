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
  replies?: Comment[];
  replyCount?: number;
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [collapsedReplies, setCollapsedReplies] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      // Load all comments for this post
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        // Enrich comments with profile data
        const enrichedComments = commentsData.map(comment => ({
          ...comment,
          username: profiles?.find(p => p.id === comment.user_id)?.username || 'User',
          avatar_url: profiles?.find(p => p.id === comment.user_id)?.avatar_url || null
        }));

        // Organize comments into parent-child structure
        const parentComments = enrichedComments.filter(c => !c.parent_comment_id);
        const childComments = enrichedComments.filter(c => c.parent_comment_id);

        // Add replies to parent comments
        const commentsWithReplies = parentComments.map(parent => ({
          ...parent,
          replies: childComments.filter(child => child.parent_comment_id === parent.id),
          replyCount: childComments.filter(child => child.parent_comment_id === parent.id).length
        }));

        setComments(commentsWithReplies);
      } else {
        setComments([]);
      }
    } catch (error: any) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (parentId: string | null = null) => {
    if (!currentUserId) {
      toast.error(t('Please login to comment', '请先登录'));
      return;
    }

    const content = parentId ? replyText : newComment;
    if (!content.trim()) {
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
          content: content.trim(),
          parent_comment_id: parentId
        });

      if (error) throw error;

      if (parentId) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
      await loadComments();
      toast.success(t('Comment added', '评论已添加'));
    } catch (error: any) {
      console.error('Comment error:', error);
      toast.error(t('Failed to add comment', '添加评论失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReplies = (commentId: string) => {
    setCollapsedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
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
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  {/* Main Comment */}
                  <div className="flex gap-1.5 items-start">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      {comment.avatar_url ? (
                        <AvatarImage src={comment.avatar_url} alt={comment.username} />
                      ) : (
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {comment.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted/50 rounded-2xl px-3 py-2 max-w-[85%]">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-foreground">
                            {comment.username || 'User'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground break-words text-left">{comment.content}</p>
                      </div>
                      
                      {/* Reply and View Replies Buttons */}
                      <div className="flex items-center gap-3 mt-1 ml-3">
                        <button
                          onClick={() => setReplyingTo(comment.id)}
                          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {t('Reply', '回复')}
                        </button>
                        {comment.replyCount! > 0 && (
                          <button
                            onClick={() => toggleReplies(comment.id)}
                            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                          >
                            {collapsedReplies.has(comment.id) 
                              ? `${t('Show', '显示')} ${comment.replyCount} ${t('replies', '条回复')}`
                              : `${t('Hide', '隐藏')} ${t('replies', '回复')}`
                            }
                          </button>
                        )}
                      </div>

                      {/* Reply Input */}
                      {replyingTo === comment.id && (
                        <div className="mt-2 flex gap-2">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {currentUserId ? 'U' : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex gap-2">
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={t('Write a reply...', '写回复...')}
                              className="min-h-[60px] resize-none text-sm"
                            />
                            <div className="flex flex-col gap-1">
                              <Button
                                size="icon"
                                onClick={() => handleSubmitComment(comment.id)}
                                disabled={submitting || !replyText.trim()}
                                className="h-8 w-8"
                              >
                                {submitting ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText('');
                                }}
                                className="h-8 w-8"
                              >
                                <span className="text-xs">✕</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Nested Replies */}
                      {comment.replies && comment.replies.length > 0 && !collapsedReplies.has(comment.id) && (
                        <div className="mt-2 ml-4 space-y-2 border-l-2 border-muted pl-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-1.5 items-start">
                              <Avatar className="h-7 w-7 flex-shrink-0">
                                {reply.avatar_url ? (
                                  <AvatarImage src={reply.avatar_url} alt={reply.username} />
                                ) : (
                                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                    {reply.username?.[0]?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="bg-muted/30 rounded-2xl px-3 py-2 max-w-[90%]">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-semibold text-foreground">
                                      {reply.username || 'User'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-foreground break-words text-left">{reply.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
                    handleSubmitComment(null);
                  }
                }}
              />
              <Button
                size="icon"
                onClick={() => handleSubmitComment(null)}
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
