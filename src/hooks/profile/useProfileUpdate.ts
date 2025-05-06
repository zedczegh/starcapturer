
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from "@/contexts/LanguageContext";
import { useAvatar } from './useAvatar';

interface ProfileFormValues {
  username: string;
}

export function useProfileUpdate() {
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();
  const {
    avatarFile,
    avatarUrl,
    setAvatarUrl,
    uploadingAvatar,
    uploadAvatar,
    handleAvatarChange,
    removeAvatar
  } = useAvatar();

  const updateProfile = async (
    userId: string,
    formData: ProfileFormValues,
    currentAvatarUrl: string | null,
    tags: string[],
    saveProfileTags: (userId: string, tags: string[]) => Promise<void>
  ) => {
    try {
      setSaving(true);
      
      // Upload avatar if changed
      let newAvatarUrl = currentAvatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(userId);
      }

      // Check if profile exists first
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username: formData.username,
            avatar_url: newAvatarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
        
        if (updateError) throw updateError;
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: formData.username,
            avatar_url: newAvatarUrl,
            updated_at: new Date().toISOString()
          });
        
        if (insertError) throw insertError;
      }

      // Save tags
      await saveProfileTags(userId, tags);

      toast.success(t("Profile updated successfully", "个人资料更新成功"), {
        description: avatarFile ? t("Your avatar has been updated", "您的头像已更新") : undefined
      });
      
      return {
        success: true,
        username: formData.username,
        avatar_url: newAvatarUrl
      };
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(t("Update failed", "更新失败"), { 
        description: error.message
      });
      return { success: false };
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    avatarUrl,
    setAvatarUrl,
    uploadingAvatar,
    handleAvatarChange,
    removeAvatar,
    updateProfile
  };
}
