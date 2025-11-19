import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

interface UseFeedInfiniteScrollProps {
  feedFilter: 'all' | 'following';
  userId?: string;
  hashtag?: string;
  pageSize?: number;
}

export const useFeedInfiniteScroll = ({
  feedFilter,
  userId,
  hashtag,
  pageSize = 10
}: UseFeedInfiniteScrollProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);

  const fetchPosts = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 0) {
        setLoading(true);
      }

      let query = supabase
        .from('user_posts')
        .select(`
          *,
          profiles!user_posts_user_id_fkey (
            username,
            avatar_url
          )
        `);

      // Filter by following if enabled and user is logged in
      if (feedFilter === 'following' && userId) {
        const { data: followingData } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', userId);

        const followingIds = followingData?.map(f => f.following_id) || [];
        
        if (followingIds.length === 0) {
          setPosts([]);
          setHasMore(false);
          setLoading(false);
          setRefreshing(false);
          loadingRef.current = false;
          return;
        }

        query = query.in('user_id', followingIds);
      }

      // Filter by hashtag if provided
      if (hashtag) {
        query = query.ilike('description', `%#${hashtag}%`);
      }

      const from = isRefresh ? 0 : pageNum * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const newPosts = (data as any) || [];
      
      if (isRefresh) {
        setPosts(newPosts);
        setPage(0);
      } else {
        setPosts(prev => pageNum === 0 ? newPosts : [...prev, ...newPosts]);
      }
      
      setHasMore(newPosts.length === pageSize);
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, [feedFilter, userId, hashtag, pageSize]);

  // Initial load
  useEffect(() => {
    setPage(0);
    setPosts([]);
    setHasMore(true);
    fetchPosts(0);
  }, [feedFilter, hashtag, userId]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingRef.current && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  }, [page, loading, hasMore, fetchPosts]);

  const refresh = useCallback(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    fetchPosts(0, true);
  }, [fetchPosts]);

  return {
    posts,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh
  };
};
