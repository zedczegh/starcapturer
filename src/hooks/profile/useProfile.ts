
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getRandomAstronomyTip } from '@/utils/astronomyTips';
import { toast } from 'sonner';
import { UseFormSetValue } from 'react-hook-form';
import { ProfileFormValues } from '@/components/profile/form/UsernameField';

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
  const fetchProfile = useCallback(async (userId: string, setValue: UseFormSetValue<ProfileFormValues>) => {
    try {
      console.log("Fetching profile for user ID:", userId);
      
      // First check if the profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }

      // If profile doesn't exist, create one
      if (!data) {
        console.log("No profile found, creating one for user:", userId);
        
        // Create a profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{ id: userId, username: '' }])
          .select('username, avatar_url')
          .single();
          
        if (createError) {
          console.error("Error creating profile:", createError);
          throw createError;
        }
        
        // Use the newly created profile
        if (newProfile) {
          setProfile({
            username: newProfile.username || '',
            avatar_url: newProfile.avatar_url,
            date_of_birth: null,
            tags: [],
          });
          setValue('username', newProfile.username || '');
          setAvatarUrl(newProfile.avatar_url);
        }
      } else {
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
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      throw error;
    }
  }, []);

  // Upload avatar to Supabase Storage
  const uploadAvatar = useCallback(async (userId: string, file: File): Promise<string | null> => {
    if (!file) return null;
    
    try {
      console.log("Starting avatar upload for user:", userId);
      setUploadingAvatar(true);
      
      // First ensure avatars bucket exists
      try {
        // Check if bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const avatarsBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
        
        if (!avatarsBucketExists) {
          console.log("Avatars bucket doesn't exist. Creating it...");
          // Since we can't create the bucket from the client, we'll let the user know
          toast.error("Storage bucket not configured. Please contact support.");
          return null;
        }
      } catch (error) {
        console.error("Error checking buckets:", error);
        // Continue anyway as the bucket might exist
      }
      
      // Create a unique filename with timestamp and userId to avoid cache issues
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      
      console.log(`Uploading avatar to avatars/${fileName}`);
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          cacheControl: '0'
        });
      
      if (error) {
        console.error("Avatar upload error:", error);
        toast.error("Failed to upload avatar. Please try again.");
        throw error;
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
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  }, []);

  // Save profile tags
  const saveProfileTags = useCallback(async (userId: string, newTags: string[]) => {
    try {
      console.log("Saving profile tags for user:", userId, newTags);
      
      // First ensure profile exists
      await ensureProfileExists(userId);
      
      // Remove all current tags for this user, then insert selected ones
      await supabase.from('profile_tags').delete().eq('user_id', userId);
      
      if (newTags.length === 0) return;
      
      const tagRows = newTags.map((tag) => ({
        user_id: userId,
        tag,
      }));
      
      const { error } = await supabase.from('profile_tags').insert(tagRows);
      
      if (error) {
        console.error("Error saving profile tags:", error);
        throw error;
      }
      
      setTags(newTags);
      setProfile((prev) =>
        prev ? { ...prev, tags: newTags } : prev
      );
    } catch (error) {
      console.error("Error in saveProfileTags:", error);
      throw error;
    }
  }, []);

  // Helper function to ensure user profile exists
  const ensureProfileExists = useCallback(async (userId: string) => {
    try {
      // Check if profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking profile existence:", error);
        return false;
      }
      
      if (!data) {
        // Create profile if doesn't exist
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{ id: userId }]);
          
        if (createError) {
          console.error("Error creating profile:", createError);
          return false;
        }
        
        console.log("Created new profile for user:", userId);
      }
      
      return true;
    } catch (err) {
      console.error("Failed to ensure profile exists:", err);
      return false;
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
    uploadAvatar,
    tags,
    setTags,
    saveProfileTags,
    ensureProfileExists
  }
}
