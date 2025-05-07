
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ensureProfileExists } from '@/hooks/profile/utils/profilePersistence';
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
      
      // First ensure profile exists
      await ensureProfileExists(userId);
      
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
      
      // Update local state
      setTags(newTags);
      return true;
    } catch (error) {
      console.log("Error in saveProfileTags:", error);
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
