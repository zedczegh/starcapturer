
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getRandomAstronomyTip } from '@/utils/astronomyTips';

interface Profile {
  username: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  tags: string[];
}

export function useProfile() {
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

  // Upload avatar to Supabase Storage
  const uploadAvatar = useCallback(async (userId: string, file: File): Promise<string | null> => {
    if (!file) return null;
    
    try {
      setUploadingAvatar(true);
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(`${userId}`, file, {
          upsert: true,
          cacheControl: '3600'
        });
      
      if (error) throw error;
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);
      
      const publicUrl = publicUrlData.publicUrl;
      setAvatarUrl(publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    } finally {
      setUploadingAvatar(false);
    }
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
    uploadAvatar,
    tags,
    setTags,
    saveProfileTags,
  }
}
