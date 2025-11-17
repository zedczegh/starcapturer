import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { PostImageCarousel } from '@/components/profile/PostImageCarousel';
import { PostInteractions } from '@/components/profile/PostInteractions';
import { PostComments } from '@/components/profile/PostComments';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());

  const toggleComments = (postId: string) => {
    setOpenComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    const { data } = supabase.storage.from('user-posts').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const getPostImages = (post: CollectedPost): string[] => {
    if (post.images && Array.isArray(post.images) && post.images.length > 0) {
      return post.images;
    }
    return [getFileUrl(post.file_path)];
  };

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="bg-cosmic-800/40 backdrop-blur-xl border border-primary/10 rounded-lg overflow-hidden">
            {/* Post Images Carousel */}
            <div className="relative">
              <PostImageCarousel 
                images={getPostImages(post)}
                alt={post.description || post.file_name}
              />
            </div>

            {/* Post Description with User Info */}
            {post.description && (
              <div className="p-4 border-b border-primary/10">
                <div className="flex items-start gap-3 mb-2">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                    <AvatarImage src={post.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {post.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-white">
                        {post.username || 'User'}
                      </span>
                      <span className="text-xs text-cosmic-400">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-cosmic-200 break-words whitespace-pre-wrap">
                      {post.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Post Interactions */}
            <div className="px-4 py-3">
              <PostInteractions 
                postId={post.id}
                userId={post.user_id}
                currentUserId={user?.id}
                onCommentClick={() => toggleComments(post.id)}
                showComments={openComments.has(post.id)}
              />
            </div>

            {/* Comments Section */}
            {openComments.has(post.id) && (
              <div className="border-t border-primary/10">
                <PostComments postId={post.id} />
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
