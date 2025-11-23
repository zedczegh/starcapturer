import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFeedsCache } from '@/hooks/cache/useFeedsCache';

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
  const { getCachedFeeds, cacheFeeds } = useFeedsCache();

  const fetchPosts = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 0) {
        setLoading(true);
        
        // Check cache for initial load
        if (userId && !hashtag) {
          const cached = getCachedFeeds(userId, 1);
          if (cached && cached.length > 0) {
            setPosts(cached);
            setLoading(false);
            loadingRef.current = false;
            return;
          }
        }
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

      // Filter by following
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

      // Filter by hashtag
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
        // Cache first page after refresh
        if (userId && !hashtag && newPosts.length > 0) {
          cacheFeeds(userId, newPosts, 1);
        }
      } else {
        const updatedPosts = pageNum === 0 ? newPosts : [...posts, ...newPosts];
        setPosts(updatedPosts);
        // Cache first page
        if (pageNum === 0 && userId && !hashtag && newPosts.length > 0) {
          cacheFeeds(userId, newPosts, 1);
        }
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
  }, [feedFilter, userId, hashtag, pageSize, getCachedFeeds, cacheFeeds, posts]);

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
