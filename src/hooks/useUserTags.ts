
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { ensureProfileExists } from '@/components/profile/tags/ProfileUtils';
import { UserTag } from '@/components/profile/tags/UserTagsTypes';

export type { UserTag };

export function useUserTags() {
  const [tags, setTags] = useState<UserTag[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  // Fetch tags for current user or specified user
  const fetchUserTags = useCallback(async (userId?: string) => {
    try {
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) {
        console.log("No user ID available to fetch tags");
        return;
      }
      
      setLoading(true);
      
      // First ensure the user has a profile
      await ensureProfileExists(targetUserId);
      
      console.log("Fetching tags for user:", targetUserId);
      
      const { data, error } = await supabase
        .from('profile_tags')
        .select('id, tag')
        .eq('user_id', targetUserId);
      
      if (error) {
        console.error("Error fetching user tags:", error);
        toast.error(t("Failed to load tags", "加载标签失败"));
        return;
      }
      
      if (data) {
        console.log(`Fetched ${data.length} tags for user:`, targetUserId);
        const formattedTags: UserTag[] = data.map(item => ({
          id: item.id,
          name: item.tag,
          icon_url: null
        }));
        
        setTags(formattedTags);
      } else {
        setTags([]);
      }
    } catch (err) {
      console.error("Error in fetchUserTags:", err);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  // Add a new tag for current user or specified user
  const addUserTag = useCallback(async (userId: string, tagName: string) => {
    try {
      if (!tagName.trim()) {
        return null;
      }
      
      // Verify user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t("You must be logged in to add tags", "您必须登录才能添加标签"));
        return null;
      }
      
      // Verify this is the current user's profile
      if (session.user.id !== userId) {
        toast.error(t("You can only update your own profile", "您只能更新自己的个人资料"));
        return null;
      }
      
      console.log(`Adding tag "${tagName}" for user:`, userId);
      
      // First ensure the user has a profile
      await ensureProfileExists(userId);
      
      // Check if tag already exists to avoid duplicates
      const { data: existingTags } = await supabase
        .from('profile_tags')
        .select('id, tag')
        .eq('user_id', userId)
        .eq('tag', tagName);
        
      if (existingTags && existingTags.length > 0) {
        console.log(`Tag "${tagName}" already exists for user:`, userId);
        return existingTags[0];
      }
      
      // Add new tag
      const { data, error } = await supabase
        .from('profile_tags')
        .insert({ user_id: userId, tag: tagName })
        .select()
        .single();
      
      if (error) {
        console.error("Error adding user tag:", error);
        toast.error(t("Failed to add tag", "添加标签失败"));
        throw error;
      }
      
      if (userId === user?.id) {
        // Update local state only for current user
        setTags(prev => [...prev, { 
          id: data.id, 
          name: data.tag,
          icon_url: null
        }]);
      }
      
      console.log(`Tag "${tagName}" added successfully for user:`, userId);
      return data;
    } catch (err) {
      console.error("Error in addUserTag:", err);
      return null;
    }
  }, [user, t]);

  // Remove a tag
  const removeUserTag = useCallback(async (tagId: string) => {
    try {
      // Get the tag information to verify ownership
      const { data: tagData, error: tagError } = await supabase
        .from('profile_tags')
        .select('user_id')
        .eq('id', tagId)
        .single();
        
      if (tagError) {
        console.error("Error getting tag info:", tagError);
        return false;
      }
      
      // Check if current user owns this tag
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.id !== tagData.user_id) {
        toast.error(t("You can only remove your own tags", "您只能删除自己的标签"));
        return false;
      }
      
      console.log("Removing tag with ID:", tagId);
      
      const { error } = await supabase
        .from('profile_tags')
        .delete()
        .eq('id', tagId);
      
      if (error) {
        console.error("Error removing user tag:", error);
        toast.error(t("Failed to remove tag", "删除标签失败"));
        return false;
      }
      
      setTags(prev => prev.filter(tag => tag.id !== tagId));
      console.log("Tag removed successfully");
      return true;
    } catch (err) {
      console.error("Error in removeUserTag:", err);
      return false;
    }
  }, [t]);

  // Load tags for current user on mount
  useEffect(() => {
    if (user) {
      fetchUserTags();
    }
  }, [user, fetchUserTags]);

  return {
    tags,
    loading,
    fetchUserTags,
    addUserTag,
    removeUserTag
  };
}
