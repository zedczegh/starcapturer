
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
      let avatarUploaded = false;
      
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(userId);
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl;
          avatarUploaded = true;
        }
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

      // Only show one toast with appropriate description
      toast.success(t("Profile updated successfully", "个人资料更新成功"), {
        description: avatarUploaded ? t("Your avatar has been updated", "您的头像已更新") : undefined
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
