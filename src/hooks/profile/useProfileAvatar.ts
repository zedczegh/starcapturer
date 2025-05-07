
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
      
      // Ensure the user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("User is not authenticated");
        toast.error(t("Authentication required to upload avatar", "需要认证才能上传头像"));
        return null;
      }
      
      // First ensure the bucket exists
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(bucket => bucket.name === 'avatars');
        
        if (!bucketExists) {
          console.log("Creating avatars bucket...");
          await supabase.storage.createBucket('avatars', {
            public: true,
            fileSizeLimit: 2 * 1024 * 1024 // 2MB limit
          });
          console.log("Avatars bucket created successfully");
        }
      } catch (err) {
        console.error("Bucket check error:", err);
        // Continue anyway as the bucket might exist but not be visible due to permissions
      }
      
      // Create a unique filename to avoid cache issues
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
      
      console.log(`Uploading avatar with content type ${file.type} to avatars/${fileName}`);
      
      // Upload the file with explicit content type
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        });
      
      if (error) {
        console.error("Avatar upload error:", error);
        if (error.message.includes('Permission denied')) {
          toast.error(t("Permission denied. Please contact an administrator.", "权限被拒绝，请联系管理员。"));
        } else {
          toast.error(t("Failed to upload avatar. Please try again.", "上传头像失败，请重试。"));
        }
        return null;
      }
      
      console.log("Avatar uploaded successfully to path:", data?.path);
      
      // Get the public URL from Supabase
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      if (!publicUrlData) {
        console.error("Failed to get public URL for uploaded avatar");
        toast.error(t("Failed to process avatar", "处理头像失败"));
        return null;
      }
      
      const publicUrl = publicUrlData.publicUrl;
      console.log("Avatar public URL:", publicUrl);
      
      // Show success toast for avatar upload
      toast.success(t("Avatar uploaded successfully", "头像上传成功"));
      
      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(t("Avatar upload failed", "头像上传失败") + `: ${error.message}`);
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
