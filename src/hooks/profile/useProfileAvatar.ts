
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
      
      // Create a unique filename with timestamp and userId to avoid cache issues
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      
      console.log(`Uploading avatar to avatars/${fileName}`);
      
      // Check if the avatars bucket exists, create if it doesn't
      const { data: buckets } = await supabase.storage.listBuckets();
      const avatarsBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
      
      if (!avatarsBucketExists) {
        console.log("Avatars bucket doesn't exist, creating...");
        const { error: bucketError } = await supabase.storage.createBucket('avatars', {
          public: true
        });
        
        if (bucketError) {
          console.error("Error creating avatars bucket:", bucketError);
          toast.error(t("Failed to create storage for avatars", "无法创建头像存储"));
          return null;
        }
      }
      
      // Make sure the user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t("You must be logged in to upload an avatar", "您必须登录才能上传头像"));
        return null;
      }
      
      // Verify this is the current user's profile
      if (session.user.id !== userId) {
        toast.error(t("You can only update your own profile", "您只能更新自己的个人资料"));
        return null;
      }
      
      // Upload the file with proper content type
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type, // Set the proper content type based on the file
          cacheControl: 'no-cache' // Prevent caching issues
        });
      
      if (error) {
        console.error("Avatar upload error:", error);
        toast.error(t("Failed to upload avatar. Please try again.", "上传头像失败，请重试。"));
        return null;
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
