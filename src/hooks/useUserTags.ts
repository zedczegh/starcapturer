
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  }, [user]);

  // Add a new tag for current user or specified user
  const addUserTag = useCallback(async (userId: string, tagName: string) => {
    try {
      if (!tagName.trim()) {
        return null;
      }
      
      // Check if tag already exists
      const { data: existingTags } = await supabase
        .from('profile_tags')
        .select('id, tag')
        .eq('user_id', userId)
        .eq('tag', tagName);
        
      if (existingTags && existingTags.length > 0) {
        console.log(`Tag "${tagName}" already exists for user:`, userId);
        return existingTags[0];
      }
      
      // First ensure the user has a profile
      const profileExists = await ensureProfileExists(userId);
      if (!profileExists) {
        console.error("Failed to ensure profile exists");
        return null;
      }
      
      // Add new tag
      const { data, error } = await supabase
        .from('profile_tags')
        .insert({ user_id: userId, tag: tagName })
        .select()
        .single();
      
      if (error) {
        console.error("Error adding user tag:", error);
        return null;
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
  }, [user]);

  // Remove a tag
  const removeUserTag = useCallback(async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('profile_tags')
        .delete()
        .eq('id', tagId);
      
      if (error) {
        console.error("Error removing user tag:", error);
        return false;
      }
      
      setTags(prev => prev.filter(tag => tag.id !== tagId));
      console.log("Tag removed successfully");
      return true;
    } catch (err) {
      console.error("Error in removeUserTag:", err);
      return false;
    }
  }, []);

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
