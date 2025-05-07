
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function useProfileAvatar() {
  const { t } = useLanguage();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Upload avatar to Supabase Storage
  const uploadAvatar = useCallback(async (userId: string, file: File): Promise<string | null> => {
    if (!file) return null;
    
    try {
      console.log("Starting avatar upload for user:", userId);
      setUploadingAvatar(true);
      
      // Create a unique filename with timestamp and userId to avoid cache issues
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      
      console.log(`Uploading avatar to avatars/${fileName}`);
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          cacheControl: '0'
        });
      
      if (error) {
        console.error("Avatar upload error:", error);
        toast.error(t("Failed to upload avatar. Please try again.", "上传头像失败，请重试。"));
        throw error;
      }
      
      console.log("Avatar uploaded successfully:", data);
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      const publicUrl = publicUrlData.publicUrl;
      console.log("Avatar public URL:", publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  }, [t]);

  return {
    avatarFile,
    setAvatarFile,
    avatarUrl,
    setAvatarUrl,
    uploadingAvatar,
    setUploadingAvatar,
    uploadAvatar
  };
}
