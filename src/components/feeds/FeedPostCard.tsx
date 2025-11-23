import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PostInteractions } from '@/components/profile/PostInteractions';
import { PostComments } from '@/components/profile/PostComments';
import { PostImageCarousel } from '@/components/profile/PostImageCarousel';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { navigateToUserProfile } from '@/utils/navigation';
import { ParsedPostContent } from '@/utils/postContentParser';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface Post {
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
}

interface FeedPostCardProps {
  post: Post;
  currentUserId?: string;
  index: number;
  onHashtagClick: (hashtag: string) => void;
}

export const FeedPostCard: React.FC<FeedPostCardProps> = ({
  post,
  currentUserId,
  index,
  onHashtagClick
}) => {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    const { data } = supabase.storage.from('user-posts').getPublicUrl(filePath);
    return data?.publicUrl || '';
  };

  const getPostImages = (): string[] => {
    if (post.images && Array.isArray(post.images) && post.images.length > 0) {
      return post.images.map(path => getFileUrl(path));
    }
    return [getFileUrl(post.file_path)];
  };

  const images = getPostImages();
  const allImagesLoaded = images.every(img => imagesLoaded[img]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="bg-cosmic-800/40 backdrop-blur-xl border-l-0 border-r-0 sm:border-l sm:border-r border-y sm:border border-primary/10 rounded-none sm:rounded-lg overflow-hidden"
    >
      {/* Image Loading Skeleton */}
      {!allImagesLoaded && (
        <Skeleton className="w-full aspect-square bg-cosmic-700/50" />
      )}
      
      {/* Post Images Carousel */}
      <div className={allImagesLoaded ? 'relative' : 'hidden'}>
        <PostImageCarousel 
          images={images}
          alt={post.description || post.file_path}
        />
      </div>

      {/* Hidden image preloaders */}
      {images.map(src => (
        <img
          key={src}
          src={src}
          alt=""
          className="hidden"
          onLoad={() => setImagesLoaded(prev => ({ ...prev, [src]: true }))}
          onError={() => setImagesLoaded(prev => ({ ...prev, [src]: true }))}
        />
      ))}

      {/* Post Description with User Info */}
      {post.description && (
        <div className="px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-start gap-2 sm:gap-3">
            <Avatar 
              className="h-7 w-7 sm:h-8 sm:w-8 border border-primary/20 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all flex-shrink-0"
              onClick={() => navigateToUserProfile(navigate, post.user_id, currentUserId)}
            >
              <AvatarImage src={post.profiles?.avatar_url || ''} alt={post.profiles?.username || 'User'} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="text-xs sm:text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigateToUserProfile(navigate, post.user_id, currentUserId)}
                >
                  {post.profiles?.username || 'User'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-cosmic-200 text-xs sm:text-sm text-left">
                <ParsedPostContent 
                  content={post.description} 
                  onHashtagClick={onHashtagClick}
                />
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Post Interactions */}
      <div className="px-2 sm:px-2 py-1.5 sm:py-2 border-t border-primary/10">
        <PostInteractions 
          postId={post.id}
          userId={post.user_id}
          currentUserId={currentUserId}
          onCommentClick={() => setShowComments(!showComments)}
          showComments={showComments}
        />
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-primary/10">
          <PostComments 
            postId={post.id}
            currentUserId={currentUserId}
          />
        </div>
      )}
    </motion.div>
  );
};
