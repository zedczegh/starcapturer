import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import NavBar from '@/components/NavBar';
import { Loader2 } from 'lucide-react';
import FeedPostCard from '@/components/feeds/FeedPostCard';

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_posts')
        .select(`
          *,
          profiles!user_posts_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setPosts(data as any || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8 pt-20 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent mb-2">
            {t("Feeds", "动态")}
          </h1>
          <p className="text-cosmic-300 text-sm">
            {t("Explore posts from the community", "探索社区动态")}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-cosmic-300">
              {t("No posts yet", "暂无动态")}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <FeedPostCard 
                key={post.id} 
                post={post}
                onUpdate={fetchPosts}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feeds;
