import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, Image, Edit, Plus, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/optimized-components';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PostInteractions } from './PostInteractions';
import { PostComments } from './PostComments';
import { EditPostDialog } from './EditPostDialog';
import { PostImageCarousel } from './PostImageCarousel';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { useLocation } from 'react-router-dom';

interface UserPost {
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

interface UserPostsManagerProps {
  userId: string;
  isOwnProfile?: boolean;
  currentUserId?: string;
  onCreatePost?: () => void;
}

export const UserPostsManager: React.FC<UserPostsManagerProps> = ({ 
  userId, 
  isOwnProfile = false,
  currentUserId,
  onCreatePost
}) => {
  const { t } = useLanguage();
  const location = useLocation();
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<UserPost | null>(null);
  const [username, setUsername] = useState<string>('user');
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
    loadUsername();
  }, [userId]);

  // Handle hash-based highlighting
  useEffect(() => {
    const hash = location.hash;
    if (hash.startsWith('#post-')) {
      const postId = hash.replace('#post-', '');
      setHighlightedPostId(postId);
      
      // Remove highlight after 3 seconds
      const timer = setTimeout(() => {
        setHighlightedPostId(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [location.hash]);

  const loadUsername = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data?.username) {
        setUsername(data.username);
      }
    } catch (error: any) {
      console.error('Error loading username:', error);
    }
  };

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('user_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user profile for avatar and username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .single();
      
      setPosts((data || []).map(post => ({
        ...post,
        images: Array.isArray(post.images) ? post.images as string[] : [],
        username: profile?.username || 'User',
        avatar_url: profile?.avatar_url || null
      })));
    } catch (error: any) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (postId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('user-posts')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('user_posts')
        .delete()
        .eq('id', postId);

      if (dbError) throw dbError;

      setPosts(posts.filter(p => p.id !== postId));
      toast.success('Post deleted');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Delete failed');
    }
  };

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    
    // Check if it's already a full URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    const { data } = supabase.storage.from('user-posts').getPublicUrl(filePath);
    return data?.publicUrl || '';
  };

  const getPostImages = (post: UserPost): string[] => {
    // Check if post has images array (new format)
    if (post.images && Array.isArray(post.images) && post.images.length > 0) {
      return post.images.map(path => getFileUrl(path));
    }
    // Fallback to single file_path (old format)
    return [getFileUrl(post.file_path)];
  };

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

  

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="bg-cosmic-900/95 backdrop-blur-xl border border-primary/10 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
          {t('Posts', '帖子')}
        </h2>
        {isOwnProfile && onCreatePost && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCreatePost}
            className="h-10 w-10 rounded-full bg-primary/20 hover:bg-primary/30 border border-primary/30"
            title={t('Create Post', '创建帖子')}
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-cosmic-400">
          <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">{t('No posts yet', '暂无帖子')}</p>
          {isOwnProfile && (
            <p className="text-sm mt-2">{t('Share your first post above!', '发布你的第一条动态！')}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                id={`post-${post.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-cosmic-800/40 backdrop-blur-xl border rounded-lg overflow-hidden group transition-all duration-500 ${
                  highlightedPostId === post.id 
                    ? 'border-orange-500/80 shadow-[0_0_30px_rgba(249,115,22,0.5)] ring-2 ring-orange-500/50' 
                    : 'border-primary/10'
                }`}
              >
                {/* Post Images Carousel */}
                <div className="relative">
                  <PostImageCarousel 
                    images={getPostImages(post)}
                    alt={post.description || post.file_name}
                  />
                  {isOwnProfile && (
                    <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingPost(post)}
                        className="backdrop-blur-md"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(post.id, post.file_path)}
                        className="backdrop-blur-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Post Description with User Info */}
                {post.description && (
                  <div className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 border border-primary/20">
                        <AvatarImage src={post.avatar_url || ''} alt={post.username} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {post.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {post.username || 'User'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-cosmic-200 text-sm text-left">{post.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Post Interactions */}
                <div className="px-2 py-2 border-t border-primary/10">
                  <PostInteractions 
                    postId={post.id}
                    userId={post.user_id}
                    currentUserId={currentUserId}
                    onCommentClick={() => toggleComments(post.id)}
                    showComments={openComments.has(post.id)}
                  />
                </div>

                {/* Comments Section */}
                {openComments.has(post.id) && (
                  <div className="border-t border-primary/10">
                    <PostComments 
                      postId={post.id}
                      currentUserId={currentUserId}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
};
