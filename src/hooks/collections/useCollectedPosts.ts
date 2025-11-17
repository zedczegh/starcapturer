import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

const COLLECTED_POSTS_CACHE_KEY = 'collected_posts_cache';
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

interface CollectedPostsCache {
  userId: string;
  posts: CollectedPost[];
  timestamp: number;
}

export const useCollectedPosts = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CollectedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCache = useCallback((): CollectedPost[] | null => {
    if (!user) return null;
    
    try {
      const cached = localStorage.getItem(COLLECTED_POSTS_CACHE_KEY);
      if (!cached) return null;
      
      const cache: CollectedPostsCache = JSON.parse(cached);
      const now = Date.now();
      
      if (cache.userId === user.id && (now - cache.timestamp) < CACHE_MAX_AGE) {
        return cache.posts;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading cache:', error);
      return null;
    }
  }, [user]);

  const saveCache = useCallback((postsData: CollectedPost[]) => {
    if (!user) return;
    
    try {
      const cache: CollectedPostsCache = {
        userId: user.id,
        posts: postsData,
        timestamp: Date.now()
      };
      localStorage.setItem(COLLECTED_POSTS_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  }, [user]);

  const fetchCollectedPosts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setAuthChecked(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[Collected Posts] Fetching for user:', user.id);

      const { data: interactions, error: intError } = await supabase
        .from('post_interactions')
        .select('post_id')
        .eq('user_id', user.id)
        .eq('interaction_type', 'collect');

      if (intError) throw intError;

      console.log('[Collected Posts] Found interactions:', interactions?.length);

      if (interactions && interactions.length > 0) {
        const postIds = interactions.map(i => i.post_id);
        const { data: postsData, error: postsError } = await supabase
          .from('user_posts')
          .select('*')
          .in('id', postIds)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        console.log('[Collected Posts] Found posts:', postsData?.length);

        if (postsData && postsData.length > 0) {
          const userIds = [...new Set(postsData.map(p => p.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);

          const enrichedPosts = postsData.map(post => {
            // Convert image storage paths to full public URLs
            let imageUrls: string[] = [];
            if (Array.isArray(post.images) && post.images.length > 0) {
              imageUrls = post.images.map((imagePath: string) => {
                // Check if it's already a full URL
                if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                  return imagePath;
                }
                // Convert storage path to public URL
                const { data } = supabase.storage.from('user-posts').getPublicUrl(imagePath);
                return data.publicUrl;
              });
            } else if (post.file_path) {
              // Fallback to file_path if no images array
              if (post.file_path.startsWith('http://') || post.file_path.startsWith('https://')) {
                imageUrls = [post.file_path];
              } else {
                const { data } = supabase.storage.from('user-posts').getPublicUrl(post.file_path);
                imageUrls = [data.publicUrl];
              }
            }

            return {
              ...post,
              images: imageUrls,
              username: profiles?.find(p => p.id === post.user_id)?.username || 'User',
              avatar_url: profiles?.find(p => p.id === post.user_id)?.avatar_url || null
            };
          });

          console.log('[Collected Posts] Enriched posts with URLs:', enrichedPosts.length, enrichedPosts[0]?.images);
          setPosts(enrichedPosts);
          saveCache(enrichedPosts);
        } else {
          setPosts([]);
          saveCache([]);
        }
      } else {
        console.log('[Collected Posts] No interactions found');
        setPosts([]);
        saveCache([]);
      }
    } catch (err: any) {
      console.error('Error fetching collected posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  }, [user, saveCache]);

  useEffect(() => {
    if (!user) {
      setAuthChecked(true);
      setLoading(false);
      return;
    }

    const cachedPosts = loadCache();
    if (cachedPosts) {
      setPosts(cachedPosts);
      setAuthChecked(true);
      setLoading(false);
    }

    fetchCollectedPosts();
  }, [user, loadCache, fetchCollectedPosts]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('collected-posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_interactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchCollectedPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCollectedPosts]);

  const removePostImmediately = useCallback((postId: string) => {
    setPosts(prev => {
      const updated = prev.filter(p => p.id !== postId);
      saveCache(updated);
      return updated;
    });
  }, [saveCache]);

  const forceReload = useCallback(() => {
    localStorage.removeItem(COLLECTED_POSTS_CACHE_KEY);
    fetchCollectedPosts();
  }, [fetchCollectedPosts]);

  return {
    posts,
    setPosts,
    loading,
    authChecked,
    error,
    removePostImmediately,
    forceReload
  };
};
