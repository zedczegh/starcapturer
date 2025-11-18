import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, User, Loader2, Smile, Image as ImageIcon, X, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useNavigate } from 'react-router-dom';

interface Comment {
  id: string;
  spot_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  username?: string;
  avatar_url?: string;
  image_url?: string | null;
  replies?: Comment[];
  replyCount?: number;
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
}

interface SpotCommentsProps {
  spotId: string;
  currentUserId?: string;
}

export const SpotComments: React.FC<SpotCommentsProps> = ({ spotId, currentUserId }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const showComments = true;
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [collapsedReplies, setCollapsedReplies] = useState<Set<string>>(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadComments();
  }, [spotId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      // Load all comments for this spot
      const { data: commentsData, error } = await supabase
        .from('astro_spot_comments')
        .select('*')
        .eq('spot_id', spotId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        // Get likes for all comments
        const commentIds = commentsData.map(c => c.id);
        const { data: likesData } = await supabase
          .from('astro_spot_comment_likes')
          .select('comment_id, user_id')
          .in('comment_id', commentIds);

        // Enrich comments with profile data and likes
        const enrichedComments = commentsData.map(comment => {
          const commentLikes = likesData?.filter(like => like.comment_id === comment.id) || [];
          return {
            ...comment,
            username: profiles?.find(p => p.id === comment.user_id)?.username || 'User',
            avatar_url: profiles?.find(p => p.id === comment.user_id)?.avatar_url || null,
            likeCount: commentLikes.length,
            isLikedByCurrentUser: currentUserId ? commentLikes.some(like => like.user_id === currentUserId) : false
          };
        });

        // Organize comments into parent-child structure
        const parentComments = enrichedComments.filter(c => !c.parent_id);
        const childComments = enrichedComments.filter(c => c.parent_id);

        // Add replies to parent comments
        const commentsWithReplies = parentComments.map(parent => ({
          ...parent,
          replies: childComments.filter(child => child.parent_id === parent.id),
          replyCount: childComments.filter(child => child.parent_id === parent.id).length
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
    const imageFile = parentId ? replyImage : selectedImage;
    
    if (!content.trim() && !imageFile) {
      toast.error(t('Comment cannot be empty', '评论不能为空'));
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `comment_images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('comment_images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('comment_images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('astro_spot_comments')
        .insert({
          spot_id: spotId,
          user_id: currentUserId,
          content: content.trim() || '',
          parent_id: parentId,
          image_url: imageUrl
        });

      if (error) throw error;

      if (parentId) {
        setReplyText('');
        setReplyingTo(null);
        setReplyImage(null);
        setReplyImagePreview(null);
      } else {
        setNewComment('');
        setSelectedImage(null);
        setImagePreview(null);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('Image must be less than 5MB', '图片必须小于5MB'));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (isReply) {
          setReplyImage(file);
          setReplyImagePreview(reader.result as string);
        } else {
          setSelectedImage(file);
          setImagePreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData, isReply: boolean = false) => {
    if (isReply) {
      setReplyText(prev => prev + emojiData.emoji);
    } else {
      setNewComment(prev => prev + emojiData.emoji);
    }
    setShowEmojiPicker(false);
    setShowReplyEmojiPicker(false);
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

  const handleLikeComment = async (commentId: string) => {
    if (!currentUserId) {
      toast.error(t('Please login to like', '请先登录'));
      return;
    }

    try {
      const comment = comments.find(c => c.id === commentId) || 
                     comments.flatMap(c => c.replies || []).find(r => r.id === commentId);
      
      if (!comment) return;

      const isUnliking = comment.isLikedByCurrentUser;

      if (isUnliking) {
        // Unlike
        await supabase
          .from('astro_spot_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUserId);
      } else {
        // Like
        await supabase
          .from('astro_spot_comment_likes')
          .insert({
            comment_id: commentId,
            user_id: currentUserId
          });
      }

      // Update local state
      setComments(prevComments => 
        prevComments.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              likeCount: isUnliking ? (c.likeCount || 0) - 1 : (c.likeCount || 0) + 1,
              isLikedByCurrentUser: !isUnliking
            };
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map(r => 
                r.id === commentId
                  ? {
                      ...r,
                      likeCount: isUnliking ? (r.likeCount || 0) - 1 : (r.likeCount || 0) + 1,
                      isLikedByCurrentUser: !isUnliking
                    }
                  : r
              )
            };
          }
          return c;
        })
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(t('Failed to update like', '点赞失败'));
    }
  };

  return (
    <div className="bg-card/40 backdrop-blur-sm rounded-xl p-6 border border-border/40 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          {t('Comments', '评论')} ({comments.length})
        </h3>
      </div>

      <div className="w-full">
        <div className="space-y-3">
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
                    <Avatar 
                      className="h-8 w-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => navigate(`/user/${comment.user_id}`)}
                    >
                      {comment.avatar_url ? (
                        <AvatarImage src={comment.avatar_url} alt={comment.username} />
                      ) : (
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {comment.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted/50 rounded-2xl px-3 py-2 w-fit max-w-[85%]">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span 
                            className="text-xs font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/user/${comment.user_id}`)}
                          >
                            {comment.username || 'User'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {comment.content && (
                          <p className="text-sm text-foreground break-words text-left">{comment.content}</p>
                        )}
                        {comment.image_url && (
                          <img 
                            src={comment.image_url} 
                            alt="Comment" 
                            className="mt-2 rounded-lg max-w-xs max-h-48 object-cover cursor-pointer"
                            onClick={() => window.open(comment.image_url!, '_blank')}
                          />
                        )}
                      </div>
                      
                      {/* Reply, Like and View Replies Buttons */}
                      <div className="flex items-center gap-3 mt-1 ml-3">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
                            comment.isLikedByCurrentUser 
                              ? 'text-red-500 hover:text-red-600' 
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Heart className={`h-3 w-3 ${comment.isLikedByCurrentUser ? 'fill-current' : ''}`} />
                          {comment.likeCount! > 0 && <span>{comment.likeCount}</span>}
                        </button>
                        {currentUserId && (
                          <button
                            onClick={() => setReplyingTo(comment.id)}
                            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {t('Reply', '回复')}
                          </button>
                        )}
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
                        <div className="mt-2 ml-3">
                          <div className="flex gap-2 items-start">
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={t('Write a reply...', '写回复...')}
                              className="min-h-[60px] text-sm resize-none"
                            />
                          </div>
                          {replyImagePreview && (
                            <div className="relative mt-2 inline-block">
                              <img src={replyImagePreview} alt="Preview" className="max-h-32 rounded-lg" />
                              <button
                                onClick={() => {
                                  setReplyImage(null);
                                  setReplyImagePreview(null);
                                }}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            <input
                              ref={replyFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageSelect(e, true)}
                              className="hidden"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => replyFileInputRef.current?.click()}
                              disabled={submitting}
                            >
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowReplyEmojiPicker(!showReplyEmojiPicker)}
                              disabled={submitting}
                            >
                              <Smile className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText('');
                                setReplyImage(null);
                                setReplyImagePreview(null);
                              }}
                              disabled={submitting}
                            >
                              {t('Cancel', '取消')}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSubmitComment(comment.id)}
                              disabled={submitting || (!replyText.trim() && !replyImage)}
                            >
                              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                          </div>
                          {showReplyEmojiPicker && (
                            <div className="mt-2">
                              <EmojiPicker onEmojiClick={(emoji) => onEmojiClick(emoji, true)} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Replies */}
                      {!collapsedReplies.has(comment.id) && comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 space-y-2 ml-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-1.5 items-start">
                              <Avatar 
                                className="h-7 w-7 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                                onClick={() => navigate(`/user/${reply.user_id}`)}
                              >
                                {reply.avatar_url ? (
                                  <AvatarImage src={reply.avatar_url} alt={reply.username} />
                                ) : (
                                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                    {reply.username?.[0]?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="bg-muted/30 rounded-2xl px-3 py-2 w-fit max-w-[85%]">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span 
                                      className="text-xs font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                                      onClick={() => navigate(`/user/${reply.user_id}`)}
                                    >
                                      {reply.username || 'User'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  {reply.content && (
                                    <p className="text-sm text-foreground break-words text-left">{reply.content}</p>
                                  )}
                                  {reply.image_url && (
                                    <img 
                                      src={reply.image_url} 
                                      alt="Reply" 
                                      className="mt-2 rounded-lg max-w-xs max-h-48 object-cover cursor-pointer"
                                      onClick={() => window.open(reply.image_url!, '_blank')}
                                    />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 ml-3">
                                  <button
                                    onClick={() => handleLikeComment(reply.id)}
                                    className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
                                      reply.isLikedByCurrentUser 
                                        ? 'text-red-500 hover:text-red-600' 
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    <Heart className={`h-2.5 w-2.5 ${reply.isLikedByCurrentUser ? 'fill-current' : ''}`} />
                                    {reply.likeCount! > 0 && <span>{reply.likeCount}</span>}
                                  </button>
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
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('No comments yet', '还没有评论')}</p>
            </div>
          )}

          {/* New Comment Input */}
          {currentUserId && (
            <div className="border-t border-border/40 pt-4 mt-4">
              <div className="flex gap-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/20 text-primary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('Write a comment...', '写评论...')}
                    className="min-h-[80px] resize-none"
                  />
                  {imagePreview && (
                    <div className="relative mt-2 inline-block">
                      <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg" />
                      <button
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, false)}
                      className="hidden"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={submitting}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      disabled={submitting}
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleSubmitComment(null)}
                      disabled={submitting || (!newComment.trim() && !selectedImage)}
                      className="ml-auto"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {t('Post', '发布')}
                        </>
                      )}
                    </Button>
                  </div>
                  {showEmojiPicker && (
                    <div className="mt-2">
                      <EmojiPicker onEmojiClick={(emoji) => onEmojiClick(emoji, false)} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpotComments;
