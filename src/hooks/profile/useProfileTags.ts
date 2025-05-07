
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ensureProfileExists } from '@/components/profile/tags/ProfileUtils';
import { toast } from 'sonner';
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
        toast.error(t("You must be logged in to save profile tags", "您必须登录才能保存个人资料标签"));
        return false;
      }
      
      // Verify this is the current user's profile
      if (session.user.id !== userId) {
        toast.error(t("You can only update your own profile", "您只能更新自己的个人资料"));
        return false;
      }
      
      // First ensure profile exists
      const profileExists = await ensureProfileExists(userId);
      if (!profileExists) {
        toast.error(t("Failed to ensure profile exists", "确保个人资料存在失败"));
        return false;
      }
      
      // Remove all current tags for this user, then insert selected ones
      const { error: deleteError } = await supabase
        .from('profile_tags')
        .delete()
        .eq('user_id', userId);
        
      if (deleteError) {
        console.error("Error deleting existing tags:", deleteError);
        toast.error(t("Failed to update profile tags", "更新个人资料标签失败"));
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
        toast.error(t("Failed to save profile tags", "保存个人资料标签失败"));
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
  }, [t]);

  return {
    tags,
    setTags,
    loadingTags,
    saveProfileTags
  };
}
