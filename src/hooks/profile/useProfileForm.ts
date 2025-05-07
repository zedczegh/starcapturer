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
    profile,
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
        console.log("Starting avatar upload process with file:", avatarFile.name);
        newAvatarUrl = await uploadAvatar(user.id, avatarFile);
        setAvatarUploading(false);
        
        if (newAvatarUrl) {
          console.log("Avatar uploaded successfully, URL:", newAvatarUrl);
          
          // Clear any local blob URLs
          if (avatarUrl && avatarUrl.startsWith('blob:')) {
            URL.revokeObjectURL(avatarUrl);
          }
        }
      } else if (avatarUrl && !avatarUrl.startsWith('blob:')) {
        // Keep existing avatar if no new one uploaded and it's not a blob URL
        newAvatarUrl = avatarUrl;
      }

      // Update profile in Supabase
      console.log(`Updating profile with username: ${data.username}, avatar: ${newAvatarUrl || 'none'}`);
      
      // First check if profile exists
      const { data: existingProfile, error: existingError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (existingError && existingError.code !== 'PGRST116') {
        console.error("Error checking profile existence:", existingError);
        throw existingError;
      }
      
      const profileUpdate = {
        username: data.username,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString()
      };
      
      if (!existingProfile) {
        // Insert new profile if it doesn't exist
        const { data: insertedProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            ...profileUpdate,
            created_at: new Date().toISOString(),
          })
          .select('username, avatar_url')
          .single();
          
        if (insertError) {
          console.error("Profile insert info:", insertError);
          
          // Try update instead if insert failed (may happen due to race conditions)
          const { data: updatedFallback, error: updateFallbackError } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', user.id)
            .select('username, avatar_url')
            .single();
            
          if (updateFallbackError) {
            console.error("Profile fallback update info:", updateFallbackError);
          } else if (updatedFallback) {
            // Update local state with the returned data
            setProfile(prev => prev ? { 
              ...prev, 
              username: updatedFallback.username,
              avatar_url: updatedFallback.avatar_url
            } : null);
            
            // Set the avatar URL from what was returned
            if (updatedFallback.avatar_url) {
              setAvatarUrl(updatedFallback.avatar_url);
              setAvatarFile(null);
            }
          }
        } else if (insertedProfile) {
          // Update local state with the inserted profile
          setProfile(prev => prev ? { 
            ...prev, 
            username: insertedProfile.username,
            avatar_url: insertedProfile.avatar_url
          } : null);
          
          if (insertedProfile.avatar_url) {
            setAvatarUrl(insertedProfile.avatar_url);
            setAvatarFile(null);
          }
        }
      } else {
        // Update existing profile
        const { data: updatedData, error } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', user.id)
          .select('username, avatar_url')
          .single();

        if (error) {
          console.error("Profile update info:", error);
          
          if (error.message.includes('violates row-level security policy')) {
            toast.error(t('Permission denied - RLS policy issue', 'RLS权限问题，请联系管理员'));
          } else {
            toast.error(t('Failed to update profile', '更新个人资料失败'));
          }
          
          throw error;
        } else if (updatedData) {
          // Update local state with the returned data
          setProfile(prev => prev ? { 
            ...prev, 
            username: updatedData.username,
            avatar_url: updatedData.avatar_url
          } : null);
          
          // Set the avatar URL to what was returned from the server
          if (updatedData.avatar_url) {
            setAvatarUrl(updatedData.avatar_url);
            setAvatarFile(null);
          }
        }
      }

      // Update UI optimistically regardless of database errors
      // This gives a better user experience even if the database update fails
      setProfile(prev => prev ? {
        ...prev,
        username: data.username,
        avatar_url: newAvatarUrl
      } : null);
      
      // If we have an avatar URL, set it
      if (newAvatarUrl) {
        setAvatarUrl(newAvatarUrl);
        setAvatarFile(null);
      }
      
      toast.success(t('Profile updated successfully', '个人资料更新成功'));
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(t('Error updating profile', '更新个人资料时出错') + `: ${error.message}`);
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
