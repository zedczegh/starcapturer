import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import NavBar from '@/components/NavBar';
import { Loader2, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PostInteractions } from '@/components/profile/PostInteractions';
import { PostComments } from '@/components/profile/PostComments';
import { PostImageCarousel } from '@/components/profile/PostImageCarousel';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { navigateToUserProfile } from '@/utils/navigation';

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());

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

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    const { data } = supabase.storage.from('user-posts').getPublicUrl(filePath);
    return data?.publicUrl || '';
  };

  const getPostImages = (post: Post): string[] => {
    if (post.images && Array.isArray(post.images) && post.images.length > 0) {
      return post.images.map(path => getFileUrl(path));
    }
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
            <Image className="h-12 w-12 mx-auto mb-4 opacity-50 text-cosmic-400" />
            <p className="text-cosmic-300">
              {t("No posts yet", "暂无动态")}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  id={`post-${post.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-cosmic-800/40 backdrop-blur-xl border border-primary/10 rounded-lg overflow-hidden"
                >
                  {/* Post Images Carousel */}
                  <div className="relative">
                    <PostImageCarousel 
                      images={getPostImages(post)}
                      alt={post.description || post.file_path}
                    />
                  </div>

                  {/* Post Description with User Info */}
                  {post.description && (
                    <div className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <Avatar 
                          className="h-8 w-8 border border-primary/20 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                          onClick={() => navigateToUserProfile(navigate, post.user_id, user?.id)}
                        >
                          <AvatarImage src={post.profiles?.avatar_url || ''} alt={post.profiles?.username || 'User'} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span 
                              className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                              onClick={() => navigateToUserProfile(navigate, post.user_id, user?.id)}
                            >
                              {post.profiles?.username || 'User'}
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
                      currentUserId={user?.id}
                      onCommentClick={() => toggleComments(post.id)}
                      showComments={openComments.has(post.id)}
                    />
                  </div>

                  {/* Comments Section */}
                  {openComments.has(post.id) && (
                    <div className="border-t border-primary/10">
                      <PostComments 
                        postId={post.id}
                        currentUserId={user?.id}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feeds;
