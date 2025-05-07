
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCachedTags, setCachedTags } from '@/utils/tagCache';

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
      if (!userId) return;

      // Check cache first to avoid flickering
      const cachedTags = getCachedTags(userId);
      if (cachedTags) {
        setTags(cachedTags);
        setLoading(false);
        
        // Still refresh in background but don't show loading state
        refreshTagsInBackground(userId);
        return;
      }
      
      setLoading(true);
      
      // Get tags from profile_tags table
      const { data: tagData, error } = await supabase
        .from('profile_tags')
        .select('id, tag')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      if (tagData) {
        const processedTags = tagData.map(item => ({
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
      }
    } catch (error: any) {
      console.error('Error fetching user tags:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh tags in background without setting loading state
  const refreshTagsInBackground = async (userId: string) => {
    try {
      // Get tags from profile_tags table
      const { data: tagData, error } = await supabase
        .from('profile_tags')
        .select('id, tag')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      if (tagData) {
        const processedTags = tagData.map(item => ({
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
      }
    } catch (error) {
      console.error('Error refreshing tags in background:', error);
    }
  };

  // Add a new tag to user's profile
  const addUserTag = async (userId: string, tagName: string) => {
    try {
      // First ensure the profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        // Attempt to create the profile if it doesn't exist
        try {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              updated_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error("Error creating missing profile:", insertError);
            toast.error(t('Profile not found. Please try signing out and back in.', '找不到个人资料。请尝试重新登录。'));
            return null;
          } else {
            console.log("Created missing profile for user:", userId);
          }
        } catch (createProfileError) {
          console.error("Error creating profile:", createProfileError);
          toast.error(t('Profile not found. Please try signing out and back in.', '找不到个人资料。请尝试重新登录。'));
          return null;
        }
      }
      
      // Check if the tag already exists to prevent duplicates
      const existingTag = tags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase());
      if (existingTag) {
        return existingTag; // Tag already exists, return it
      }
      
      const { data, error } = await supabase
        .from('profile_tags')
        .insert({ user_id: userId, tag: tagName })
        .select()
        .single();
        
      if (error) {
        console.error("Error adding user tag:", error);
        throw error;
      }
      
      if (data) {
        const newTag = { 
          id: data.id, 
          name: data.tag, 
          icon_url: null 
        };
        
        setTags(prev => [...prev, newTag]);
        toast.success(t('Tag added successfully', '标签添加成功'));
        
        return newTag;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error adding user tag:', error);
      toast.error(t('Failed to add tag', '添加标签失败'));
      return null;
    }
  };

  // Remove a tag from user's profile
  const removeUserTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('profile_tags')
        .delete()
        .eq('id', tagId);
        
      if (error) throw error;
      
      setTags(prev => prev.filter(tag => tag.id !== tagId));
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
