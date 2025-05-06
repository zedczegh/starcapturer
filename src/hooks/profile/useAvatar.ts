
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useLanguage } from "@/contexts/LanguageContext";

export function useAvatar() {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { t } = useLanguage();

  const ensureAvatarsBucket = async (): Promise<boolean> => {
    try {
      // Check if the avatars bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error("Error checking storage buckets:", bucketsError);
        return false;
      }
      
      const avatarsBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
      
      if (!avatarsBucketExists) {
        const { error: createBucketError } = await supabase.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 2097152 // 2MB
        });
        
        if (createBucketError) {
          console.error("Error creating avatars bucket:", createBucketError);
          return false;
        }
        
        // Set RLS policies for the new bucket
        console.log("Avatars bucket created successfully");
      }
      
      return true;
    } catch (error) {
      console.error("Error ensuring avatars bucket exists:", error);
      return false;
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return avatarUrl;
    
    try {
      setUploadingAvatar(true);
      
      // Ensure the storage bucket exists
      const bucketExists = await ensureAvatarsBucket();
      
      if (!bucketExists) {
        toast.error(t("Cannot upload avatar", "无法上传头像"), {
          description: t("Storage is not configured properly", "存储配置不正确")
        });
        return null;
      }
      
      // Generate a unique file name
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}/${uuidv4()}.${fileExt}`;
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        toast.error(t("Avatar upload failed", "头像上传失败"), { 
          description: uploadError.message 
        });
        return null;
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      // Add cache-busting parameter to force browser to reload the image
      const cacheBustUrl = `${publicUrl}?t=${new Date().getTime()}`;
      return cacheBustUrl;
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(t("Avatar upload failed", "头像上传失败"), { 
        description: error.message 
      });
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error(t("File too large", "文件太大"), {
          description: t("Avatar must be less than 2MB", "头像必须小于2MB")
        });
        return;
      }
      
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
    }
  };

  const removeAvatar = () => {
    setAvatarUrl(null);
    setAvatarFile(null);
  };

  return {
    avatarFile,
    avatarUrl,
    setAvatarUrl,
    uploadingAvatar,
    uploadAvatar,
    handleAvatarChange,
    removeAvatar
  };
}
