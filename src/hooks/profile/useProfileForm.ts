
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
  } = useProfile();

  // Handle form submission
  const handleSubmit = async (data: { username: string }) => {
    if (!user) return;

    try {
      setSaving(true);
      console.log("Submitting profile form with username:", data.username);

      // Upload avatar if selected
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        setAvatarUploading(true);
        newAvatarUrl = await uploadAvatar(user.id, avatarFile);
        setAvatarUploading(false);
        
        if (!newAvatarUrl) {
          toast.error(t('Failed to upload avatar', '上传头像失败'));
          setSaving(false);
          return;
        }
      }

      // Update profile in Supabase
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
      }

      toast.success(t('Profile updated successfully', '个人资料更新成功'));
    } catch (error: any) {
      toast.error(t('Failed to update profile', '更新个人资料失败'));
      console.error('Error updating profile:', error);
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
