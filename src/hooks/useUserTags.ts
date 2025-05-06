
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCachedTags, setCachedTags, ensureArray } from '@/utils/tagCache';

export interface UserTag {
  id: string;
  name: string;
  icon_url: string | null;
}

export function useUserTags() {
  const [tags, setTags] = useState<UserTag[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  
  // Fetch user tags
  const fetchUserTags = async (userId: string) => {
    try {
      if (!userId) {
        setTags([]);
        setLoading(false);
        return;
      }

      // Check cache first to avoid flickering
      const cachedTags = getCachedTags(userId);
      if (cachedTags) {
        setTags(cachedTags);
        setLoading(false);
        
        // Still refresh in background but don't show loading state
        refreshTagsInBackground(userId).catch(error => {
          console.error("Error refreshing tags in background:", error);
        });
        return;
      }
      
      setLoading(true);
      
      // Get tags from profile_tags table
      const { data: tagData, error } = await supabase
        .from('profile_tags')
        .select('id, tag')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const processedTags = ensureArray(tagData).map(item => ({
        id: item.id,
        name: item.tag,
        icon_url: null // We'll add the icon URL in a moment
      }));
      
      // Fetch tag icons from the user_tags bucket if any exist
      for (const tag of processedTags) {
        try {
          const tagSlug = tag.name.toLowerCase().replace(/\s+/g, '-');
          const { data } = supabase.storage
            .from('user_tags')
            .getPublicUrl(`icons/${tagSlug}.png`);
            
          tag.icon_url = data.publicUrl;
        } catch (err) {
          // No icon available for this tag, continue
        }
      }
      
      setTags(processedTags);
      
      // Update cache
      setCachedTags(userId, processedTags);
    } catch (error: any) {
      console.error('Error fetching user tags:', error);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh tags in background without setting loading state
  const refreshTagsInBackground = async (userId: string) => {
    if (!userId) return;
    
    try {
      // Get tags from profile_tags table
      const { data: tagData, error } = await supabase
        .from('profile_tags')
        .select('id, tag')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const processedTags = ensureArray(tagData).map(item => ({
        id: item.id,
        name: item.tag,
        icon_url: null
      }));
      
      // Fetch tag icons from the user_tags bucket if any exist
      for (const tag of processedTags) {
        try {
          const tagSlug = tag.name.toLowerCase().replace(/\s+/g, '-');
          const { data } = supabase.storage
            .from('user_tags')
            .getPublicUrl(`icons/${tagSlug}.png`);
            
          tag.icon_url = data.publicUrl;
        } catch (err) {
          // No icon available for this tag, continue
        }
      }
      
      setTags(processedTags);
      
      // Update cache
      setCachedTags(userId, processedTags);
    } catch (error) {
      console.error('Error refreshing tags in background:', error);
      // Don't update state or show error to user, just log it
    }
  };

  // Add a new tag to user's profile
  const addUserTag = async (userId: string, tagName: string) => {
    if (!userId || !tagName) return null;
    
    try {
      const { data, error } = await supabase
        .from('profile_tags')
        .insert({ user_id: userId, tag: tagName })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        // Use the ensureArray helper to ensure we're working with an array
        setTags(prev => [...ensureArray(prev), { 
          id: data.id, 
          name: data.tag, 
          icon_url: null 
        }]);
        
        toast.success(t('Tag added successfully', '标签添加成功'));
      }
      
      return data;
    } catch (error: any) {
      console.error('Error adding user tag:', error);
      toast.error(t('Failed to add tag', '添加标签失败'));
      return null;
    }
  };

  // Remove a tag from user's profile
  const removeUserTag = async (tagId: string) => {
    if (!tagId) return false;
    
    try {
      const { error } = await supabase
        .from('profile_tags')
        .delete()
        .eq('id', tagId);
        
      if (error) throw error;
      
      // Use the ensureArray helper to ensure we're working with an array
      setTags(prev => ensureArray(prev).filter(tag => tag.id !== tagId));
      toast.success(t('Tag removed successfully', '标签移除成功'));
      
      return true;
    } catch (error: any) {
      console.error('Error removing user tag:', error);
      toast.error(t('Failed to remove tag', '移除标签失败'));
      return false;
    }
  };
  
  return {
    tags,
    loading,
    fetchUserTags,
    addUserTag,
    removeUserTag
  };
}
