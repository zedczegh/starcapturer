
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/profile/useProfile';
import { User } from '@supabase/supabase-js';

export function useProfileForm(user: User | null) {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const {
    setProfile,
    avatarFile,
    setAvatarFile,
    avatarUrl,
    setAvatarUrl,
    uploadAvatar,
    ensureProfileExists,
  } = useProfile();

  // Handle form submission
  const handleSubmit = async (data: { username: string }) => {
    if (!user) {
      toast.error(t('You must be logged in to update your profile', '您必须登录才能更新个人资料'));
      return;
    }

    try {
      setSaving(true);
      console.log("Submitting profile form with username:", data.username);

      // Verify user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('Authentication required', '需要认证'));
        setSaving(false);
        return;
      }

      // Ensure profile exists first
      await ensureProfileExists(user.id);

      // Upload avatar if selected
      let newAvatarUrl = null;
      if (avatarFile) {
        setAvatarUploading(true);
        console.log("Starting avatar upload process...");
        newAvatarUrl = await uploadAvatar(user.id, avatarFile);
        setAvatarUploading(false);
        
        if (!newAvatarUrl) {
          toast.error(t('Failed to upload avatar', '上传头像失败'));
          setSaving(false);
          return; // Stop the process if avatar upload fails
        } else {
          console.log("Avatar uploaded successfully, URL:", newAvatarUrl);
        }
      } else if (avatarUrl) {
        // Keep existing avatar if no new one uploaded
        newAvatarUrl = avatarUrl;
        console.log("Keeping existing avatar URL:", newAvatarUrl);
      }

      // Update profile in Supabase
      console.log(`Updating profile with username: ${data.username}, avatar: ${newAvatarUrl || 'none'}`);
      const { error, data: updatedProfile } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('username, avatar_url')
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        toast.error(t('Failed to update profile', '更新个人资料失败'));
        throw error;
      }

      console.log("Profile updated successfully:", updatedProfile);

      // Update local state with the returned data to ensure consistency
      setProfile(prev => prev ? { 
        ...prev, 
        username: updatedProfile.username,
        avatar_url: updatedProfile.avatar_url
      } : null);

      // Force refresh avatar url to break cache
      if (updatedProfile.avatar_url) {
        const refreshedUrl = `${updatedProfile.avatar_url}?v=${new Date().getTime()}`;
        setAvatarUrl(refreshedUrl);
        console.log("Setting refreshed avatar URL:", refreshedUrl);
        
        // Clear the avatarFile to prevent re-uploads
        setAvatarFile(null);
      } else {
        setAvatarUrl(null);
      }

      toast.success(t('Profile updated successfully', '个人资料更新成功'));
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(t('Failed to update profile', '更新个人资料失败'));
    } finally {
      setSaving(false);
    }
  };

  return {
    handleSubmit,
    saving,
    avatarUploading
  };
}
