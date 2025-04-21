
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getRandomAstronomyTip } from '@/utils/astronomyTips';

interface Profile {
  username: string | null;
  avatar_url: string | null;
  date_of_birth: string | null; // Keeping this in the interface for backward compatibility
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [randomTip, setRandomTip] = useState<[string, string] | null>(getRandomAstronomyTip());

  // Simplified; you can expand as needed
  const fetchProfile = useCallback(async (userId: string, setValue: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .maybeSingle();
      
    if (!error && data) {
      setProfile({
        username: data.username || '',
        avatar_url: data.avatar_url,
        date_of_birth: null, // No longer used but kept for interface compatibility
      });
      setValue('username', data.username || '');
      setAvatarUrl(data.avatar_url);
    }
    return { data, error };
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
    fetchProfile
  }
}
