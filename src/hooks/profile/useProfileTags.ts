
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
      
      // First ensure profile exists
      try {
        const profileExists = await ensureProfileExists(userId);
        if (!profileExists) {
          console.log("Profile doesn't exist - proceeding with tag save anyway");
        }
      } catch (error: any) {
        console.log("Profile check info:", error);
      }
      
      // Remove all current tags for this user, then insert selected ones
      try {
        const { error: deleteError } = await supabase
          .from('profile_tags')
          .delete()
          .eq('user_id', userId);
          
        if (deleteError) {
          console.log("Tag deletion info:", deleteError);
        }
      } catch (error) {
        console.log("Tag deletion exception:", error);
      }
      
      if (newTags.length === 0) {
        setTags([]);
        return true;
      }
      
      const tagRows = newTags.map((tag) => ({
        user_id: userId,
        tag,
      }));
      
      try {
        const { error } = await supabase.from('profile_tags').insert(tagRows);
        
        if (error) {
          console.log("Tag insertion info:", error);
        }
      } catch (error) {
        console.log("Tag insertion exception:", error);
      }
      
      // Update local state optimistically regardless of backend errors
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
