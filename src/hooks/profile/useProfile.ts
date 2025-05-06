
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getRandomAstronomyTip } from '@/utils/astronomyTips';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { v4 as uuidv4 } from 'uuid';

interface Profile {
  username: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  tags: string[];
}

export function useProfile() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [randomTip, setRandomTip] = useState<[string, string] | null>(getRandomAstronomyTip());
  const [tags, setTags] = useState<string[]>([]);

  // Fetch profile, including tags
  const fetchProfile = useCallback(async (userId: string, setValue: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      // Fetch tags
      const { data: tagsData } = await supabase
        .from('profile_tags')
        .select('tag')
        .eq('user_id', userId);

      const tagArr = tagsData ? tagsData.map(t => t.tag) : [];
      setProfile({
        username: data.username || '',
        avatar_url: data.avatar_url,
        date_of_birth: null,
        tags: tagArr,
      });
      setValue('username', data.username || '');
      setTags(tagArr);
      setAvatarUrl(data.avatar_url);
    }
    return { data, error };
  }, []);

  // Save profile tags
  const saveProfileTags = useCallback(async (userId: string, newTags: string[]) => {
    // Remove all current tags for this user, then insert selected ones
    await supabase.from('profile_tags').delete().eq('user_id', userId);
    if (newTags.length === 0) return;
    const tagRows = newTags.map((tag) => ({
      user_id: userId,
      tag,
    }));
    await supabase.from('profile_tags').insert(tagRows);
    setTags(newTags);
    setProfile((prev) =>
      prev ? { ...prev, tags: newTags } : prev
    );
  }, []);

  // Upload avatar with better error handling
  const uploadAvatar = useCallback(async (userId: string): Promise<string | null> => {
    if (!avatarFile) return avatarUrl;
    
    try {
      setUploadingAvatar(true);
      
      // Check if storage bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const avatarsBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
      
      if (!avatarsBucketExists) {
        // Try to create the bucket if it doesn't exist
        try {
          console.log("Avatars bucket not found. Creating bucket...");
          const { error: createError } = await supabase.storage.createBucket('avatars', {
            public: true,
            fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
          });
          
          if (createError) {
            console.error('Failed to create avatars bucket:', createError);
            toast.error(t("Cannot upload avatar", "无法上传头像"), {
              description: t("Storage is not configured properly.", "存储配置不正确。")
            });
            return null;
          }
          
          console.log('Avatars bucket created successfully');
        } catch (bucketError) {
          console.error("Error creating avatars bucket:", bucketError);
          toast.error(t("Cannot upload avatar", "无法上传头像"), {
            description: t("Storage configuration failed.", "存储配置失败。")
          });
          return null;
        }
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
      
      // Add a cache-busting parameter to prevent browser caching of old images
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
  }, [avatarFile, avatarUrl, t]);

  return {
    profile,
    setProfile,
    avatarFile,
    setAvatarFile,
    avatarUrl,
    setAvatarUrl,
    uploadingAvatar,
    setUploadingAvatar,
    randomTip,
    setRandomTip,
    fetchProfile,
    tags,
    setTags,
    saveProfileTags,
    uploadAvatar
  }
}
