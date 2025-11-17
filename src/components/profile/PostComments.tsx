import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, User, Loader2, Smile, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  username?: string;
  avatar_url?: string;
  image_url?: string | null;
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
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: currentUserId,
          content: content.trim() || '',
          parent_comment_id: parentId,
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
                      <div className="bg-muted/50 rounded-2xl px-3 py-2 inline-block">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-foreground">
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
                            className="mt-2 rounded-lg max-w-xs max-h-48 object-cover"
                          />
                        )}
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
                        <div className="mt-2 space-y-2">
                          {replyImagePreview && (
                            <div className="relative inline-block ml-9">
                              <img src={replyImagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                              <button
                                onClick={() => {
                                  setReplyImage(null);
                                  setReplyImagePreview(null);
                                }}
                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                {currentUserId ? 'U' : '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex flex-col gap-2">
                              <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={t('Write a reply...', '写回复...')}
                                className="min-h-[60px] resize-none text-sm"
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setShowReplyEmojiPicker(!showReplyEmojiPicker)}
                                >
                                  <Smile className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => replyFileInputRef.current?.click()}
                                >
                                  <ImageIcon className="h-4 w-4" />
                                </Button>
                                <input
                                  ref={replyFileInputRef}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleImageSelect(e, true)}
                                />
                                <div className="flex-1" />
                                <Button
                                  size="sm"
                                  onClick={() => handleSubmitComment(comment.id)}
                                  disabled={submitting || (!replyText.trim() && !replyImage)}
                                >
                                  {submitting ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Send className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText('');
                                    setReplyImage(null);
                                    setReplyImagePreview(null);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              {showReplyEmojiPicker && (
                                <div className="absolute z-50 mt-12">
                                  <EmojiPicker onEmojiClick={(emoji) => onEmojiClick(emoji, true)} />
                                </div>
                              )}
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
                                <div className="bg-muted/30 rounded-2xl px-3 py-2 inline-block">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-semibold text-foreground">
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
                                      className="mt-2 rounded-lg max-w-xs max-h-48 object-cover"
                                    />
                                  )}
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
            <div className="space-y-2">
              {imagePreview && (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex gap-2 items-end">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('Write a comment...', '写评论...')}
                  className="min-h-[60px] bg-cosmic-950/50 border-primary/20 resize-none text-sm flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment(null);
                    }
                  }}
                />
                <div className="flex flex-col gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageSelect(e)}
                  />
                  <Button
                    size="icon"
                    onClick={() => handleSubmitComment(null)}
                    disabled={submitting || (!newComment.trim() && !selectedImage)}
                    className="flex-shrink-0"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {showEmojiPicker && (
                <div className="absolute z-50">
                  <EmojiPicker onEmojiClick={(emoji) => onEmojiClick(emoji, false)} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
