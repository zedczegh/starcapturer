
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ensureProfileExists } from './utils/profilePersistence';
import { useLanguage } from '@/contexts/LanguageContext';

export function useProfileTags() {
  const { t } = useLanguage();
  const [tags, setTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // Save profile tags
  const saveProfileTags = useCallback(async (userId: string, newTags: string[]) => {
    try {
      console.log("Saving profile tags for user:", userId);
      setLoadingTags(true);
      
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("Not authenticated");
        return false;
      }
      
      // Verify this is the current user's profile
      if (session.user.id !== userId) {
        console.error("Cannot update another user's profile");
        return false;
      }
      
      // First ensure profile exists
      try {
        const profileExists = await ensureProfileExists(userId);
        if (!profileExists) {
          console.error("Profile doesn't exist");
          return false;
        }
      } catch (error: any) {
        console.error("Profile check error:", error);
        return false;
      }
      
      // Remove all current tags for this user, then insert selected ones
      const { error: deleteError } = await supabase
        .from('profile_tags')
        .delete()
        .eq('user_id', userId);
        
      if (deleteError) {
        console.error("Error deleting existing tags:", deleteError);
        return false;
      }
      
      if (newTags.length === 0) {
        setTags([]);
        return true;
      }
      
      const tagRows = newTags.map((tag) => ({
        user_id: userId,
        tag,
      }));
      
      const { error } = await supabase.from('profile_tags').insert(tagRows);
      
      if (error) {
        console.error("Error saving profile tags:", error);
        return false;
      }
      
      setTags(newTags);
      return true;
    } catch (error) {
      console.error("Error in saveProfileTags:", error);
      return false;
    } finally {
      setLoadingTags(false);
    }
  }, []);

  return {
    tags,
    setTags,
    loadingTags,
    saveProfileTags
  };
}
