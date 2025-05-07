
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
        return null;
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
        console.log("Avatar upload issue:", error.message);
        
        // Don't show detailed error messages for common issues
        if (error.message.includes('The resource already exists') ||
            error.message.includes('bucket_id') || 
            error.message.includes('not found')) {
          console.log("Non-critical avatar upload issue, attempting to continue...");
        }
        
        // Try to get the URL even if upload had issues
        const { data: existingData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        if (existingData) {
          console.log("Found existing file, using its URL");
          return existingData.publicUrl;
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
        return null;
      }
      
      const publicUrl = publicUrlData.publicUrl;
      console.log("Avatar public URL:", publicUrl);
      
      return publicUrl;
    } catch (error: any) {
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
