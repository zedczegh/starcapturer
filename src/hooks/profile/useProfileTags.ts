
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ensureProfileExists } from './utils/profilePersistence';

export function useProfileTags() {
  const [tags, setTags] = useState<string[]>([]);

  // Save profile tags
  const saveProfileTags = useCallback(async (userId: string, newTags: string[]) => {
    try {
      console.log("Saving profile tags for user:", userId, newTags);
      
      // First ensure profile exists
      await ensureProfileExists(userId);
      
      // Remove all current tags for this user, then insert selected ones
      await supabase.from('profile_tags').delete().eq('user_id', userId);
      
      if (newTags.length === 0) return;
      
      const tagRows = newTags.map((tag) => ({
        user_id: userId,
        tag,
      }));
      
      const { error } = await supabase.from('profile_tags').insert(tagRows);
      
      if (error) {
        console.error("Error saving profile tags:", error);
        throw error;
      }
      
      setTags(newTags);
    } catch (error) {
      console.error("Error in saveProfileTags:", error);
      throw error;
    }
  }, []);

  return {
    tags,
    setTags,
    saveProfileTags
  };
}
