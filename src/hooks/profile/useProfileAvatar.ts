
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
    if (!file) {
      console.error("No file provided for upload");
      return null;
    }
    
    try {
      console.log("Starting avatar upload for user:", userId);
      setUploadingAvatar(true);
      
      // Check if avatars bucket exists, create if not
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'avatars');
      
      if (!bucketExists) {
        console.log("Creating avatars bucket...");
        const { error: bucketError } = await supabase.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 2 * 1024 * 1024 // 2MB limit
        });
        
        if (bucketError) {
          console.error("Error creating avatars bucket:", bucketError);
          // Continue anyway as the bucket might exist but not be visible due to permissions
        }
      }
      
      // Create a unique filename with timestamp and userId to avoid cache issues
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
      
      console.log(`Uploading avatar to avatars/${fileName}`);
      
      // Upload the file with proper content type
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type // Set the proper content type based on the file
        });
      
      if (error) {
        console.error("Avatar upload error:", error);
        toast.error(t("Failed to upload avatar. Please try again.", "上传头像失败，请重试。"));
        return null;
      }
      
      console.log("Avatar uploaded successfully:", data);
      
      // Get the public URL from Supabase
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      const publicUrl = publicUrlData.publicUrl;
      console.log("Avatar public URL:", publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(t("Avatar upload failed", "头像上传失败"));
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
