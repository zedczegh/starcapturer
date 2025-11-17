import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Loader2, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/optimized-components';
import { PostInteractions } from './PostInteractions';
import { PostComments } from './PostComments';
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
}

interface UserPostsManagerProps {
  userId: string;
  isOwnProfile?: boolean;
  currentUserId?: string;
}

export const UserPostsManager: React.FC<UserPostsManagerProps> = ({ 
  userId, 
  isOwnProfile = false,
  currentUserId 
}) => {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [collectedPosts, setCollectedPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('my-feeds');

  useEffect(() => {
    loadPosts();
    if (currentUserId) {
      loadCollectedPosts();
    }
  }, [userId, currentUserId]);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('user_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
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
        setCollectedPosts(postsData || []);
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
    const { data } = supabase.storage.from('user-posts').getPublicUrl(filePath);
    return data?.publicUrl || '';
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
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {displayedPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-cosmic-800/40 backdrop-blur-xl border border-primary/10 rounded-lg overflow-hidden"
              >
                {/* Post Image */}
                <div className="relative w-full aspect-square">
                  <OptimizedImage
                    src={getFileUrl(post.file_path)}
                    alt={post.description || post.file_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-full flex flex-col items-center justify-center bg-cosmic-900 text-center p-4';
                        fallback.innerHTML = `<svg class="h-12 w-12 text-cosmic-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg><span class="text-sm text-cosmic-400">${post.file_name}</span>`;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                  {isOwnProfile && selectedTab === 'my-feeds' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(post.id, post.file_path)}
                      className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Post Description */}
                {post.description && (
                  <div className="px-4 py-3">
                    <p className="text-cosmic-200 text-sm">{post.description}</p>
                  </div>
                )}

                {/* Post Interactions */}
                <div className="px-2 py-2 border-t border-primary/10">
                  <PostInteractions 
                    postId={post.id}
                    userId={post.user_id}
                    currentUserId={currentUserId}
                  />
                </div>

                {/* Comments */}
                <div className="px-4 py-2 border-t border-primary/10">
                  <PostComments 
                    postId={post.id}
                    currentUserId={currentUserId}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
};
