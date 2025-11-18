import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageSquare, Bookmark, MapPin, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';

const ActivityHistory = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('my-activity');

  // Fetch user's own post interactions
  const { data: myPostInteractions } = useQuery({
    queryKey: ['my-post-interactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_interactions')
        .select(`
          *,
          user_posts(id, description, file_path, user_id)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch user's own post comments
  const { data: myPostComments } = useQuery({
    queryKey: ['my-post-comments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          user_posts(id, description, file_path, user_id)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch user's own astro spot comments
  const { data: mySpotComments } = useQuery({
    queryKey: ['my-spot-comments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('astro_spot_comments')
        .select(`
          *,
          user_astro_spots(id, name, user_id)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch interactions on user's posts
  const { data: interactionsOnMyPosts } = useQuery({
    queryKey: ['interactions-on-my-posts', user?.id],
    queryFn: async () => {
      // First get user's posts
      const { data: posts } = await supabase
        .from('user_posts')
        .select('id')
        .eq('user_id', user?.id);
      
      if (!posts || posts.length === 0) return [];
      
      const postIds = posts.map(p => p.id);
      
      const { data, error } = await supabase
        .from('post_interactions')
        .select(`
          *,
          user_posts(id, description, file_path, user_id),
          profiles!post_interactions_user_id_fkey(username, avatar_url)
        `)
        .in('post_id', postIds)
        .neq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch comments on user's posts
  const { data: commentsOnMyPosts } = useQuery({
    queryKey: ['comments-on-my-posts', user?.id],
    queryFn: async () => {
      const { data: posts } = await supabase
        .from('user_posts')
        .select('id')
        .eq('user_id', user?.id);
      
      if (!posts || posts.length === 0) return [];
      
      const postIds = posts.map(p => p.id);
      
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          user_posts(id, description, file_path, user_id),
          profiles!post_comments_user_id_fkey(username, avatar_url)
        `)
        .in('post_id', postIds)
        .neq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch comments on user's astro spots
  const { data: commentsOnMySpots } = useQuery({
    queryKey: ['comments-on-my-spots', user?.id],
    queryFn: async () => {
      const { data: spots } = await supabase
        .from('user_astro_spots')
        .select('id')
        .eq('user_id', user?.id);
      
      if (!spots || spots.length === 0) return [];
      
      const spotIds = spots.map(s => s.id);
      
      const { data, error } = await supabase
        .from('astro_spot_comments')
        .select(`
          *,
          user_astro_spots(id, name, user_id),
          profiles(username, avatar_url)
        `)
        .in('spot_id', spotIds)
        .neq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const renderActivityItem = (item: any, type: string) => {
    const isMyActivity = activeTab === 'my-activity';
    
    return (
      <Card key={item.id} className="p-4 mb-3 bg-cosmic-900/20 backdrop-blur-xl border-primary/10 hover:border-primary/30 transition-colors">
        <div className="flex items-start gap-3">
          {!isMyActivity && (
            <Avatar className="h-10 w-10">
              <AvatarImage src={item.profiles?.avatar_url} />
              <AvatarFallback>{item.profiles?.username?.[0] || '?'}</AvatarFallback>
            </Avatar>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {type === 'post-interaction' && <Heart className="h-4 w-4 text-red-400" />}
              {type === 'post-comment' && <MessageSquare className="h-4 w-4 text-blue-400" />}
              {type === 'spot-comment' && <MapPin className="h-4 w-4 text-green-400" />}
              
              <span className="text-sm text-cosmic-300">
                {!isMyActivity && <span className="font-medium text-foreground">{item.profiles?.username || 'Someone'} </span>}
                {type === 'post-interaction' && (
                  <>
                    {item.interaction_type === 'like' && t('liked your post', '点赞了你的帖子')}
                    {item.interaction_type === 'heart' && t('loved your post', '喜欢了你的帖子')}
                    {item.interaction_type === 'collect' && t('collected your post', '收藏了你的帖子')}
                  </>
                )}
                {type === 'post-comment' && t('commented on your post', '评论了你的帖子')}
                {type === 'spot-comment' && t('commented on your astro spot', '评论了你的观星点')}
              </span>
            </div>
            
            {item.content && (
              <p className="text-sm text-cosmic-200 mb-2">{item.content}</p>
            )}
            
            <p className="text-xs text-cosmic-400">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-cosmic-950 to-slate-900">
      <NavBar />
      
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/profile')}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('Back to Profile', '返回个人资料')}
        </Button>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-white via-primary to-purple-400 bg-clip-text text-transparent">
          {t('Activity History', '活动历史')}
        </h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="my-activity">
              {t('My Activity', '我的活动')}
            </TabsTrigger>
            <TabsTrigger value="on-my-content">
              {t('On My Content', '我的内容')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-activity" className="space-y-4">
            <div className="space-y-2">
              {myPostInteractions?.map(item => renderActivityItem(item, 'post-interaction'))}
              {myPostComments?.map(item => renderActivityItem(item, 'post-comment'))}
              {mySpotComments?.map(item => renderActivityItem(item, 'spot-comment'))}
              
              {!myPostInteractions?.length && !myPostComments?.length && !mySpotComments?.length && (
                <Card className="p-8 text-center bg-cosmic-900/20 backdrop-blur-xl border-primary/10">
                  <p className="text-cosmic-400">{t('No activity yet', '暂无活动')}</p>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="on-my-content" className="space-y-4">
            <div className="space-y-2">
              {interactionsOnMyPosts?.map(item => renderActivityItem(item, 'post-interaction'))}
              {commentsOnMyPosts?.map(item => renderActivityItem(item, 'post-comment'))}
              {commentsOnMySpots?.map(item => renderActivityItem(item, 'spot-comment'))}
              
              {!interactionsOnMyPosts?.length && !commentsOnMyPosts?.length && !commentsOnMySpots?.length && (
                <Card className="p-8 text-center bg-cosmic-900/20 backdrop-blur-xl border-primary/10">
                  <p className="text-cosmic-400">{t('No interactions yet', '暂无互动')}</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ActivityHistory;
