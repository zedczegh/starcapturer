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
    
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    const { data } = supabase.storage.from('user-posts').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const getFirstImage = (post: CollectedPost): string => {
    if (post.images && Array.isArray(post.images) && post.images.length > 0) {
      return post.images[0];
    }
    return getFileUrl(post.file_path);
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
              {getFirstImage(post) ? (
                <img 
                  src={getFirstImage(post)}
                  alt={post.description || post.file_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-cosmic-400" />
                </div>
              )}
              
              {/* Image count badge if multiple images */}
              {post.images && post.images.length > 1 && (
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
