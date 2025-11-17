import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Image as ImageIcon } from 'lucide-react';

interface CollectedPost {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description: string | null;
  category: string;
  created_at: string;
  images?: string[];
  username?: string;
  avatar_url?: string;
}

interface CollectedPostsGridProps {
  posts: CollectedPost[];
}

export const CollectedPostsGrid: React.FC<CollectedPostsGridProps> = ({ posts }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    
    // If it's already a full URL, return it
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    // Otherwise, get the public URL from storage
    const { data } = supabase.storage.from('user-posts').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const getFirstImage = (post: CollectedPost): string => {
    console.log('[CollectedPostsGrid] Post images:', post.images, 'File path:', post.file_path, 'File type:', post.file_type);
    
    // Check if images array exists and has items
    if (post.images && Array.isArray(post.images) && post.images.length > 0) {
      const firstImage = post.images[0];
      
      // Check if it's a video file
      if (firstImage.includes('.webm') || firstImage.includes('.mp4') || firstImage.includes('.mov')) {
        console.log('[CollectedPostsGrid] Video detected, returning empty for now');
        return ''; // Return empty for videos - we'll handle with video element
      }
      
      console.log('[CollectedPostsGrid] Using first image from array:', firstImage);
      return firstImage;
    }
    
    // Fall back to file_path
    const url = getFileUrl(post.file_path);
    console.log('[CollectedPostsGrid] Using file_path URL:', url);
    return url;
  };

  const isVideo = (post: CollectedPost): boolean => {
    const firstItem = post.images?.[0] || post.file_path;
    return firstItem?.includes('.webm') || firstItem?.includes('.mp4') || firstItem?.includes('.mov') || false;
  };

  const handlePostClick = (post: CollectedPost) => {
    navigate(`/user/${post.user_id}`, { state: { scrollToPost: post.id } });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card 
            className="bg-cosmic-800/40 backdrop-blur-xl border border-primary/10 rounded-lg overflow-hidden hover:border-primary/30 transition-all cursor-pointer group"
            onClick={() => handlePostClick(post)}
          >
            {/* Thumbnail Image */}
            <div className="relative aspect-square overflow-hidden bg-cosmic-900">
              {isVideo(post) ? (
                <video 
                  src={post.images?.[0] || getFileUrl(post.file_path)}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  onLoadedData={(e) => {
                    // Seek to 1 second to get a frame
                    const video = e.currentTarget;
                    video.currentTime = 1;
                  }}
                />
              ) : (
                <img 
                  src={getFirstImage(post)}
                  alt={post.description || post.file_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    console.error('[CollectedPostsGrid] Image failed to load:', getFirstImage(post));
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'w-full h-full flex items-center justify-center';
                      fallback.innerHTML = '<svg class="w-12 h-12 text-cosmic-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              )}
              
              {/* Video play icon overlay */}
              {isVideo(post) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-sm rounded-full p-3">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              )}
              
              {/* Image count badge if multiple images */}
              {post.images && post.images.length > 1 && !isVideo(post) && (
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  {post.images.length}
                </div>
              )}
            </div>

            {/* Post Info */}
            <div className="p-3">
              {/* User Info */}
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6 ring-1 ring-primary/20">
                  <AvatarImage src={post.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {post.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-white truncate">
                    {post.username || 'User'}
                  </p>
                  <p className="text-xs text-cosmic-400">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Description Preview */}
              {post.description && (
                <p className="text-sm text-cosmic-200 line-clamp-2">
                  {truncateText(post.description, 80)}
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
