import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Loader2, Image, Edit, Plus, Share2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/optimized-components';
import { PostInteractions } from './PostInteractions';
import { PostComments } from './PostComments';
import { EditPostDialog } from './EditPostDialog';
import { PostImageCarousel } from './PostImageCarousel';
import { ShareCardGenerator } from './ShareCardGenerator';
import { PostDetailDialog } from './PostDetailDialog';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [collectedPosts, setCollectedPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('my-feeds');
  const [editingPost, setEditingPost] = useState<UserPost | null>(null);
  const [selectedPost, setSelectedPost] = useState<UserPost | null>(null);
  const [username, setUsername] = useState<string>('user');

  useEffect(() => {
    loadPosts();
    loadUsername();
    if (currentUserId) {
      loadCollectedPosts();
    }
  }, [userId, currentUserId]);

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
      setPosts((data || []).map(post => ({
        ...post,
        images: Array.isArray(post.images) ? post.images as string[] : []
      })));
    } catch (error: any) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const loadCollectedPosts = async () => {
    if (!currentUserId) return;
    
    try {
      const { data: interactions, error: intError } = await supabase
        .from('post_interactions')
        .select('post_id')
        .eq('user_id', currentUserId)
        .eq('interaction_type', 'collect');

      if (intError) throw intError;

      if (interactions && interactions.length > 0) {
        const postIds = interactions.map(i => i.post_id);
        const { data: postsData, error: postsError } = await supabase
          .from('user_posts')
          .select('*')
          .in('id', postIds)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;
        setCollectedPosts((postsData || []).map(post => ({
          ...post,
          images: Array.isArray(post.images) ? post.images as string[] : []
        })));
      }
    } catch (error: any) {
      console.error('Error loading collected posts:', error);
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

  const displayedPosts = selectedTab === 'my-feeds' ? posts : collectedPosts;

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

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-4">
        <TabsList className="bg-cosmic-800/40 border-primary/20">
          <TabsTrigger value="my-feeds">
            {t('My Feeds', '我的动态')}
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="collected">
              {t('My Collected Feeds', '我的收藏')}
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      {displayedPosts.length === 0 ? (
        <div className="text-center py-16 text-cosmic-400">
          <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">{t('No posts yet', '暂无帖子')}</p>
          {isOwnProfile && selectedTab === 'my-feeds' && (
            <p className="text-sm mt-2">{t('Share your first post above!', '发布你的第一条动态！')}</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          <AnimatePresence mode="popLayout">
            {displayedPosts.map((post, index) => {
              const images = getPostImages(post);
              const firstImage = images[0] || '';
              const isVideo = firstImage.toLowerCase().includes('.mp4') || 
                             firstImage.toLowerCase().includes('.webm') ||
                             firstImage.toLowerCase().includes('video');
              
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.02 }}
                  className="relative aspect-square bg-cosmic-900 cursor-pointer group overflow-hidden rounded-sm"
                  onClick={() => setSelectedPost(post)}
                >
                  {/* Thumbnail */}
                  {isVideo ? (
                    <video
                      src={firstImage}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={firstImage}
                      alt={post.description || post.file_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                  
                  {/* Video indicator and hover overlay */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/60 rounded-full p-3">
                        <Play className="h-8 w-8 text-white fill-white" />
                      </div>
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    {images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded-md text-xs text-white">
                        1/{images.length}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      
      {/* Post Detail Dialog */}
      {selectedPost && (
        <PostDetailDialog
          open={!!selectedPost}
          onOpenChange={(open) => !open && setSelectedPost(null)}
          post={{
            ...selectedPost,
            images: getPostImages(selectedPost)
          }}
          isOwnProfile={isOwnProfile && selectedTab === 'my-feeds'}
          currentUserId={currentUserId || null}
          onEdit={() => {
            setEditingPost(selectedPost);
            setSelectedPost(null);
          }}
          onDelete={() => {
            handleDelete(selectedPost.id, selectedPost.file_path);
            setSelectedPost(null);
          }}
        />
      )}
      
      {/* Edit Post Dialog */}
      {editingPost && (
        <EditPostDialog
          postId={editingPost.id}
          currentDescription={editingPost.description || ''}
          currentImages={getPostImages(editingPost)}
          open={!!editingPost}
          onOpenChange={(open) => !open && setEditingPost(null)}
          onUpdateComplete={() => {
            loadPosts();
            setEditingPost(null);
          }}
        />
      )}
    </Card>
  );
};
