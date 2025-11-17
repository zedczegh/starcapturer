import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle, Bookmark, Share2, MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
  const [commentCount, setCommentCount] = useState(0);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    loadImageUrl();
    loadInteractions();
    loadCommentCount();
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

  const loadCommentCount = async () => {
    try {
      const { count } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);
      
      setCommentCount(count || 0);
    } catch (error) {
      console.error('Error loading comment count:', error);
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
    navigate(`/user/${post.user_id}?post=${post.id}`);
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
        <div 
          className="w-full aspect-square bg-cosmic-800/30 cursor-pointer"
          onClick={handleCommentClick}
        >
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

        {/* Comment count */}
        {commentCount > 0 && (
          <button
            onClick={handleCommentClick}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('View all', '查看全部')} {commentCount} {commentCount === 1 ? t('comment', '条评论') : t('comments', '条评论')}
          </button>
        )}
      </div>
    </div>
  );
};

export default FeedPostCard;
