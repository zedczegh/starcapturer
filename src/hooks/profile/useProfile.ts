
import { useState, useCallback } from 'react';
import { getRandomAstronomyTip } from '@/utils/astronomyTips';
import { fetchUserProfile, ensureUserProfile } from '@/utils/profileUtils';

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
      console.log("Fetching profile in useProfile hook for user:", userId);
      
      // Ensure the user profile exists in the database
      await ensureUserProfile(userId);
      
      const profileData = await fetchUserProfile(userId);
      
      if (!profileData) {
        console.error("No profile data returned");
        return { data: null, error: "No profile data returned" };
      }
      
      console.log("Profile loaded in useProfile hook:", profileData);
      
      setProfile({
        username: profileData.username || null,
        avatar_url: profileData.avatar_url,
        date_of_birth: null,
        tags: profileData.tags || [],
      });
      
      setValue('username', profileData.username || '');
      setTags(profileData.tags || []);
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
