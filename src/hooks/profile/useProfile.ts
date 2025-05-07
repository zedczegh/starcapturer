
import { useState, useCallback } from 'react';
import { getRandomAstronomyTip } from '@/utils/astronomyTips';
import { fetchUserProfile } from '@/utils/profileUtils';

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
    try {
      const profileData = await fetchUserProfile(userId);
      
      setProfile({
        username: profileData.username || '',
        avatar_url: profileData.avatar_url,
        date_of_birth: null,
        tags: profileData.tags,
      });
      
      setValue('username', profileData.username || '');
      setTags(profileData.tags);
      setAvatarUrl(profileData.avatar_url);
      
      return { data: { username: profileData.username, avatar_url: profileData.avatar_url }, error: null };
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      return { data: null, error };
    }
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
    tags,
    setTags,
  }
}
