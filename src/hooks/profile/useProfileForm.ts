
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
    avatarUrl,
    setAvatarUrl,
    uploadAvatar,
  } = useProfile();

  // Handle form submission
  const handleSubmit = async (data: { username: string }) => {
    if (!user) return;

    try {
      setSaving(true);

      // Upload avatar if selected
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(user.id, avatarFile);
        
        if (!newAvatarUrl) {
          toast.error(t('Failed to upload avatar', '上传头像失败'));
          setSaving(false);
          return;
        }
      }

      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => prev ? { 
        ...prev, 
        username: data.username,
        avatar_url: newAvatarUrl
      } : null);

      toast.success(t('Profile updated successfully', '个人资料更新成功'));
    } catch (error: any) {
      toast.error(t('Failed to update profile', '更新个人资料失败'));
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
      setAvatarUploading(false);
    }
  };

  return {
    handleSubmit,
    saving,
    avatarUploading
  };
}
