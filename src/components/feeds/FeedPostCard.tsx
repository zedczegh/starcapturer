import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle, Bookmark, Share2, MoreVertical, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

interface FeedPostCardProps {
  post: {
    id: string;
    user_id: string;
    file_path: string;
    file_type: string;
    description: string | null;
    category: string;
    images: any;
    created_at: string;
    profiles: {
      username: string | null;
      avatar_url: string | null;
    };
  };
  onUpdate: () => void;
}

const FeedPostCard: React.FC<FeedPostCardProps> = ({ post, onUpdate }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [collected, setCollected] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadImageUrl();
    loadInteractions();
    loadComments();
  }, [post.id]);

  const loadImageUrl = () => {
    // Get the main image from images array or file_path
    let imagePath = '';
    
    if (post.images && Array.isArray(post.images) && post.images.length > 0) {
      imagePath = post.images[0];
    } else if (post.file_path) {
      imagePath = post.file_path;
    }

    if (imagePath) {
      const { data } = supabase.storage
        .from('user-posts')
        .getPublicUrl(imagePath);
      setImageUrl(data.publicUrl);
    }
  };

  const loadInteractions = async () => {
    if (!user) return;

    try {
      // Check if user liked the post
      const { data: likeData } = await supabase
        .from('post_interactions')
        .select('*')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .eq('interaction_type', 'heart');
      
      setLiked(likeData && likeData.length > 0);

      // Check if user collected the post
      const { data: collectData } = await supabase
        .from('post_interactions')
        .select('*')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .eq('interaction_type', 'collect');
      
      setCollected(collectData && collectData.length > 0);

      // Get total like count
      const { count } = await supabase
        .from('post_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)
        .eq('interaction_type', 'heart');
      
      setLikeCount(count || 0);
    } catch (error) {
      console.error('Error loading interactions:', error);
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles!post_comments_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('post_id', post.id)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error(t('Please sign in to like posts', '请先登录以点赞'));
      return;
    }

    try {
      if (liked) {
        // Unlike
        await supabase
          .from('post_interactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .eq('interaction_type', 'heart');
        
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        await supabase
          .from('post_interactions')
          .insert({
            post_id: post.id,
            user_id: user.id,
            interaction_type: 'heart'
          });
        
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(t('Failed to update like', '更新点赞失败'));
    }
  };

  const handleCollect = async () => {
    if (!user) {
      toast.error(t('Please sign in to collect posts', '请先登录以收藏'));
      return;
    }

    try {
      if (collected) {
        // Uncollect
        await supabase
          .from('post_interactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .eq('interaction_type', 'collect');
        
        setCollected(false);
        toast.success(t('Removed from collection', '已取消收藏'));
      } else {
        // Collect
        await supabase
          .from('post_interactions')
          .insert({
            post_id: post.id,
            user_id: user.id,
            interaction_type: 'collect'
          });
        
        setCollected(true);
        toast.success(t('Added to collection', '已添加到收藏'));
      }
    } catch (error) {
      console.error('Error toggling collect:', error);
      toast.error(t('Failed to update collection', '更新收藏失败'));
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/user/${post.user_id}?post=${post.id}`;
    navigator.clipboard.writeText(postUrl);
    toast.success(t('Link copied to clipboard', '链接已复制到剪贴板'));
  };

  const handleUserClick = () => {
    navigate(`/user/${post.user_id}`);
  };

  const handleCommentClick = () => {
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!user) {
      toast.error(t('Please sign in to comment', '请先登录以评论'));
      return;
    }

    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      await loadComments();
      toast.success(t('Comment added', '评论已添加'));
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(t('Failed to add comment', '添加评论失败'));
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleUserClick}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.profiles.avatar_url || undefined} />
            <AvatarFallback>
              {post.profiles.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">
              {post.profiles.username || t('Anonymous', '匿名用户')}
            </p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              {t('Share', '分享')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image */}
      {imageUrl && (
        <div className="w-full aspect-square bg-cosmic-800/30">
          <img
            src={imageUrl}
            alt={post.description || 'Post image'}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${liked ? 'text-red-500' : ''}`}
              onClick={handleLike}
            >
              <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCommentClick}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${collected ? 'text-primary' : ''}`}
            onClick={handleCollect}
          >
            <Bookmark className={`h-5 w-5 ${collected ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Like count */}
        {likeCount > 0 && (
          <p className="text-sm font-semibold">
            {likeCount} {likeCount === 1 ? t('like', '个赞') : t('likes', '个赞')}
          </p>
        )}

        {/* Description */}
        {post.description && (
          <div className="text-sm">
            <span 
              className="font-semibold cursor-pointer hover:opacity-80"
              onClick={handleUserClick}
            >
              {post.profiles.username || t('Anonymous', '匿名用户')}
            </span>
            {' '}
            <span className="text-foreground/80">{post.description}</span>
          </div>
        )}

        {/* Comments Section */}
        {comments.length > 0 && !showComments && (
          <button
            onClick={handleCommentClick}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('View all', '查看全部')} {comments.length} {comments.length === 1 ? t('comment', '条评论') : t('comments', '条评论')}
          </button>
        )}

        {/* Comments Display */}
        {showComments && comments.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border/50">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2">
                <Avatar 
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => navigate(`/user/${comment.user_id}`)}
                >
                  <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span 
                      className="font-semibold text-sm cursor-pointer hover:opacity-80"
                      onClick={() => navigate(`/user/${comment.user_id}`)}
                    >
                      {comment.profiles?.username || t('Anonymous', '匿名用户')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Comment Input */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
            <AvatarFallback>
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <Input
            placeholder={t('Add a comment...', '添加评论...')}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
            className="flex-1 bg-background/50 border-border/50"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="h-8 w-8"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeedPostCard;
