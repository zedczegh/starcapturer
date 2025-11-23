import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';
import { Loader2, Image, Users, Globe } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFeedInfiniteScroll } from '@/hooks/useFeedInfiniteScroll';
import { PullToRefresh } from '@/components/feeds/PullToRefresh';
import { FeedPostCard } from '@/components/feeds/FeedPostCard';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

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

const Feeds: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [feedFilter, setFeedFilter] = useState<'all' | 'following'>('all');
  const hashtag = searchParams.get('hashtag') || undefined;

  const {
    posts,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh
  } = useFeedInfiniteScroll({
    feedFilter,
    userId: user?.id,
    hashtag,
    pageSize: 10
  });

  const loadMoreRef = useIntersectionObserver({
    onIntersect: loadMore,
    enabled: !loading && hasMore,
    threshold: 0.1,
    rootMargin: '200px'
  });

  const handleHashtagClick = (hashtag: string) => {
    setSearchParams({ hashtag });
  };

  const clearHashtagFilter = () => {
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <NavBar />
      
      <PullToRefresh onRefresh={refresh} refreshing={refreshing}>
        <div className="w-full mx-auto px-0 sm:px-4 py-6 sm:py-8 pt-16 sm:pt-20 sm:max-w-2xl">
          <div className="mb-6 sm:mb-8 px-0 sm:px-0">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent mb-2 px-3 sm:px-0">
              {t("Feeds", "动态")}
            </h1>
            <p className="text-cosmic-300 text-xs sm:text-sm px-3 sm:px-0">
              {t("Explore posts from the community", "探索社区动态")}
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="mb-4 sm:mb-6 px-0 sm:px-0">
            <Tabs value={feedFilter} onValueChange={(v) => setFeedFilter(v as 'all' | 'following')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-cosmic-800/60 backdrop-blur-xl border-transparent sm:border-primary/20 rounded-none sm:rounded-lg">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2 text-sm"
                >
                  <Globe className="h-4 w-4" />
                  {t("All Posts", "所有动态")}
                </TabsTrigger>
                <TabsTrigger 
                  value="following" 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2 text-sm"
                  disabled={!user}
                >
                  <Users className="h-4 w-4" />
                  {t("Following", "关注")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Hashtag Filter Display */}
          {hashtag && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-primary/10 rounded-none sm:rounded-lg border-l-0 border-r-0 sm:border-l sm:border-r border-y sm:border border-primary/20">
              <span className="text-sm text-foreground">
                {t("Filtering by:", "筛选：")} <span className="font-semibold text-primary">#{hashtag}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHashtagFilter}
                className="ml-auto text-xs"
              >
                {t("Clear", "清除")}
              </Button>
            </div>
          )}

          {loading && posts.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 px-3">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50 text-cosmic-400" />
              <p className="text-cosmic-300">
                {t("No posts yet", "暂无动态")}
              </p>
              {feedFilter === 'following' && (
                <p className="text-cosmic-400 text-sm mt-2">
                  {t("Follow users to see their posts here", "关注用户以查看他们的动态")}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-6">
              <AnimatePresence mode="popLayout">
                {posts.map((post, index) => (
                  <FeedPostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.id}
                    index={index}
                    onHashtagClick={handleHashtagClick}
                  />
                ))}
              </AnimatePresence>

              {/* Infinite Scroll Trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {/* End of Feed */}
              {!hasMore && posts.length > 0 && (
                <div className="text-center py-8 text-cosmic-400 text-sm">
                  {t("You've reached the end", "已经到底了")}
                </div>
              )}
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
};

export default Feeds;
