import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Heart, Share2, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface PostInteractionsProps {
  postId: string;
  userId: string;
  currentUserId?: string;
}

interface InteractionCounts {
  likes: number;
  hearts: number;
  shares: number;
  collects: number;
}

interface UserInteractions {
  liked: boolean;
  hearted: boolean;
  collected: boolean;
}

export const PostInteractions: React.FC<PostInteractionsProps> = ({ 
  postId, 
  userId,
  currentUserId 
}) => {
  const { t } = useLanguage();
  const [counts, setCounts] = useState<InteractionCounts>({
    likes: 0,
    hearts: 0,
    shares: 0,
    collects: 0
  });
  const [userInteractions, setUserInteractions] = useState<UserInteractions>({
    liked: false,
    hearted: false,
    collected: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInteractions();
  }, [postId, currentUserId]);

  const loadInteractions = async () => {
    try {
      // Load counts
      const { data: allInteractions, error } = await supabase
        .from('post_interactions')
        .select('interaction_type')
        .eq('post_id', postId);

      if (error) throw error;

      const newCounts = {
        likes: allInteractions?.filter(i => i.interaction_type === 'like').length || 0,
        hearts: allInteractions?.filter(i => i.interaction_type === 'heart').length || 0,
        shares: allInteractions?.filter(i => i.interaction_type === 'share').length || 0,
        collects: allInteractions?.filter(i => i.interaction_type === 'collect').length || 0
      };
      setCounts(newCounts);

      // Load user's interactions
      if (currentUserId) {
        const { data: userInts, error: userError } = await supabase
          .from('post_interactions')
          .select('interaction_type')
          .eq('post_id', postId)
          .eq('user_id', currentUserId);

        if (userError) throw userError;

        setUserInteractions({
          liked: userInts?.some(i => i.interaction_type === 'like') || false,
          hearted: userInts?.some(i => i.interaction_type === 'heart') || false,
          collected: userInts?.some(i => i.interaction_type === 'collect') || false
        });
      }
    } catch (error: any) {
      console.error('Error loading interactions:', error);
    }
  };

  const handleInteraction = async (type: 'like' | 'heart' | 'collect') => {
    if (!currentUserId) {
      toast.error(t('Please login to interact', '请先登录'));
      return;
    }

    setLoading(true);
    try {
      const isActive = type === 'like' ? userInteractions.liked : 
                       type === 'heart' ? userInteractions.hearted : 
                       userInteractions.collected;

      if (isActive) {
        // Remove interaction
        const { error } = await supabase
          .from('post_interactions')
          .delete()
          .eq('user_id', currentUserId)
          .eq('post_id', postId)
          .eq('interaction_type', type);

        if (error) throw error;

        setCounts(prev => ({
          ...prev,
          [type === 'like' ? 'likes' : type === 'heart' ? 'hearts' : 'collects']: 
            prev[type === 'like' ? 'likes' : type === 'heart' ? 'hearts' : 'collects'] - 1
        }));
        setUserInteractions(prev => ({
          ...prev,
          [type === 'like' ? 'liked' : type === 'heart' ? 'hearted' : 'collected']: false
        }));
      } else {
        // Add interaction
        const { error } = await supabase
          .from('post_interactions')
          .insert({
            user_id: currentUserId,
            post_id: postId,
            interaction_type: type
          });

        if (error) throw error;

        setCounts(prev => ({
          ...prev,
          [type === 'like' ? 'likes' : type === 'heart' ? 'hearts' : 'collects']: 
            prev[type === 'like' ? 'likes' : type === 'heart' ? 'hearts' : 'collects'] + 1
        }));
        setUserInteractions(prev => ({
          ...prev,
          [type === 'like' ? 'liked' : type === 'heart' ? 'hearted' : 'collected']: true
        }));
      }
    } catch (error: any) {
      console.error('Interaction error:', error);
      toast.error(t('Action failed', '操作失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/profile/${userId}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post',
          url: url
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(t('Link copied!', '链接已复制！'));
      }

      // Track share
      if (currentUserId) {
        await supabase
          .from('post_interactions')
          .insert({
            user_id: currentUserId,
            post_id: postId,
            interaction_type: 'share'
          });
        setCounts(prev => ({ ...prev, shares: prev.shares + 1 }));
      }
    } catch (error: any) {
      console.error('Share error:', error);
    }
  };

  return (
    <div className="flex items-center gap-4 px-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleInteraction('like')}
        disabled={loading}
        className={`gap-1 ${userInteractions.liked ? 'text-blue-400' : 'text-cosmic-300'}`}
      >
        <ThumbsUp className={`h-4 w-4 ${userInteractions.liked ? 'fill-current' : ''}`} />
        <span className="text-xs">{counts.likes}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleInteraction('heart')}
        disabled={loading}
        className={`gap-1 ${userInteractions.hearted ? 'text-red-400' : 'text-cosmic-300'}`}
      >
        <Heart className={`h-4 w-4 ${userInteractions.hearted ? 'fill-current' : ''}`} />
        <span className="text-xs">{counts.hearts}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="gap-1 text-cosmic-300"
      >
        <Share2 className="h-4 w-4" />
        <span className="text-xs">{counts.shares}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleInteraction('collect')}
        disabled={loading}
        className={`gap-1 ${userInteractions.collected ? 'text-yellow-400' : 'text-cosmic-300'}`}
      >
        <Bookmark className={`h-4 w-4 ${userInteractions.collected ? 'fill-current' : ''}`} />
        <span className="text-xs">{counts.collects}</span>
      </Button>
    </div>
  );
};
