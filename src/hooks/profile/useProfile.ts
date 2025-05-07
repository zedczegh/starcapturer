
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { UseFormSetValue } from 'react-hook-form';
import { ProfileFormValues } from '@/components/profile/form/UsernameField';
import { useProfileAvatar } from './useProfileAvatar';
import { useProfileTags } from './useProfileTags';
import { useAstronomyTip } from './useAstronomyTip';
import { ensureProfileExists, fetchUserProfile } from './utils/profilePersistence';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  username: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  tags: string[];
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Import functionality from smaller hooks
  const avatarHook = useProfileAvatar();
  const tagsHook = useProfileTags();
  const tipHook = useAstronomyTip();

  // Fetch profile, including tags
  const fetchProfile = useCallback(async (userId: string, setValue: UseFormSetValue<ProfileFormValues>) => {
    try {
      console.log("Fetching profile for user ID:", userId);
      
      // Fetch basic profile
      const { data } = await fetchUserProfile(userId);

      // If profile doesn't exist, handle accordingly
      if (!data) {
        console.log("No profile found, creating one for user:", userId);
        
        // Default values for a new profile
        setProfile({
          username: '',
          avatar_url: null,
          date_of_birth: null,
          tags: [],
        });
        setValue('username', '');
        avatarHook.setAvatarUrl(null);
      } else {
        // Fetch tags
        const { data: tagsData } = await supabase
          .from('profile_tags')
          .select('tag')
          .eq('user_id', userId);

        const tagArr = tagsData ? tagsData.map(t => t.tag) : [];
        
        // Update profile data and form values
        setProfile({
          username: data.username || '',
          avatar_url: data.avatar_url,
          date_of_birth: data.date_of_birth || null,
          tags: tagArr,
        });
        
        setValue('username', data.username || '');
        tagsHook.setTags(tagArr);
        
        // Set avatar URL if it exists and is valid (from Supabase storage)
        if (data.avatar_url && !data.avatar_url.startsWith('blob:')) {
          avatarHook.setAvatarUrl(data.avatar_url);
          console.log("Setting avatar URL from profile:", data.avatar_url);
        } else {
          avatarHook.setAvatarUrl(null);
        }
      }
      
      return { data };
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      throw error;
    }
  }, [avatarHook.setAvatarUrl, tagsHook.setTags]);

  return {
    profile,
    setProfile,
    fetchProfile,
    ensureProfileExists,
    // Re-export from useProfileAvatar
    ...avatarHook,
    // Re-export from useProfileTags
    ...tagsHook,
    // Re-export from useAstronomyTip
    ...tipHook,
  };
}
