import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function useFollow(profileUserId: string | undefined) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileUserId) return;
    
    fetchFollowData();
  }, [profileUserId, user]);

  const fetchFollowData = async () => {
    if (!profileUserId) return;

    try {
      // Get follower and following counts
      const { data: followerData } = await supabase.rpc('get_follower_count', {
        p_user_id: profileUserId
      });
      
      const { data: followingData } = await supabase.rpc('get_following_count', {
        p_user_id: profileUserId
      });

      setFollowerCount(followerData || 0);
      setFollowingCount(followingData || 0);

      // Check if current user is following this profile
      if (user?.id && user.id !== profileUserId) {
        const { data } = await supabase.rpc('is_following', {
          p_follower_id: user.id,
          p_following_id: profileUserId
        });
        setIsFollowing(data || false);
      }
    } catch (error) {
      console.error('Error fetching follow data:', error);
    }
  };

  const toggleFollow = async () => {
    if (!user?.id || !profileUserId) {
      toast.error(t("Please log in to follow users", "请登录以关注用户"));
      return;
    }

    if (user.id === profileUserId) {
      toast.error(t("Cannot follow yourself", "不能关注自己"));
      return;
    }

    setLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileUserId);

        if (error) throw error;

        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        toast.success(t("Unfollowed", "已取消关注"));
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: profileUserId
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast.success(t("Following", "已关注"));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error(t("Failed to update follow status", "更新关注状态失败"));
    } finally {
      setLoading(false);
    }
  };

  return {
    isFollowing,
    followerCount,
    followingCount,
    toggleFollow,
    loading,
    refetch: fetchFollowData
  };
}
