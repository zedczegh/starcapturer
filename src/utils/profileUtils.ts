
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Check if a user profile exists and create one if it doesn't
 */
export const ensureUserProfile = async (
  userId: string
): Promise<boolean> => {
  try {
    console.log('Checking if profile exists for user:', userId);
    
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileError);
      return false;
    }
    
    // If profile doesn't exist, create it
    if (!profile) {
      console.log('Profile not found, creating new profile for user:', userId);
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: null,
          avatar_url: null,
          updated_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error creating profile:', insertError);
        return false;
      }
      
      console.log('Successfully created new profile for user:', userId);
    } else {
      console.log('Profile already exists for user:', userId);
    }
    
    return true;
  } catch (error: any) {
    console.error('Exception in ensureUserProfile:', error);
    return false;
  }
};

/**
 * Upsert a user's profile with improved RLS handling
 */
export const upsertUserProfile = async (
  userId: string,
  profileData: {
    username?: string | null;
    avatar_url?: string | null;
  }
): Promise<boolean> => {
  try {
    console.log('Upserting profile for user:', userId, profileData);
    
    // First ensure the profile exists
    await ensureUserProfile(userId);
    
    // Then update the profile
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating profile:', updateError);
      toast.error('Profile update failed', { description: updateError.message });
      return false;
    }
    
    console.log('Profile updated successfully for user:', userId);
    return true;
  } catch (error: any) {
    console.error('Exception in upsertUserProfile:', error);
    toast.error('Profile update failed', { description: error.message });
    return false;
  }
};

/**
 * Upload an avatar file to Supabase storage with better error handling
 */
export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
  try {
    console.log('Uploading avatar for user:', userId);
    
    // First check if the storage bucket exists
    const { data: buckets } = await supabase.storage
      .listBuckets();
      
    const avatarBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
    
    if (!avatarBucketExists) {
      console.error('Avatars bucket does not exist');
      toast.error('Avatar upload failed: Storage not configured');
      return null;
    }
    
    // Generate unique filename to prevent conflicts
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    console.log('Uploading avatar with filename:', fileName);
    
    // Upload the file
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });
      
    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      toast.error('Avatar upload failed', { description: uploadError.message });
      return null;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
      
    console.log('Avatar uploaded successfully, public URL:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error('Exception in uploadAvatar:', error);
    toast.error('Avatar upload failed', { description: error.message });
    return null;
  }
};

/**
 * Save tags for a user profile with better error handling
 */
export const saveUserTags = async (userId: string, tags: string[]): Promise<boolean> => {
  try {
    console.log('Saving tags for user:', userId, tags);
    
    // First ensure the profile exists
    await ensureUserProfile(userId);
    
    // First delete existing tags
    const { error: deleteError } = await supabase
      .from('profile_tags')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) {
      console.error('Error deleting tags:', deleteError);
      // Continue anyway as this might be due to no existing tags
    }
    
    // If no tags to insert, we're done
    if (tags.length === 0) return true;
    
    // Insert new tags in a batch to improve performance
    const tagsToInsert = tags.map(tag => ({
      user_id: userId,
      tag
    }));
    
    const { error: insertError } = await supabase
      .from('profile_tags')
      .insert(tagsToInsert);
        
    if (insertError) {
      console.error('Error saving tags:', insertError);
      return false;
    }
    
    console.log('Tags saved successfully for user:', userId);
    return true;
  } catch (error: any) {
    console.error('Exception in saveUserTags:', error);
    return false;
  }
};

/**
 * Fetch profile tags for a user with better error handling
 */
export const fetchUserTags = async (userId: string): Promise<string[]> => {
  try {
    console.log('Fetching tags for user:', userId);
    
    const { data, error } = await supabase
      .from('profile_tags')
      .select('tag')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching user tags:', error);
      return [];
    }
    
    return data ? data.map(item => item.tag) : [];
  } catch (error) {
    console.error('Exception in fetchUserTags:', error);
    return [];
  }
};

/**
 * Fetch a user's profile data with better error handling
 */
export const fetchUserProfile = async (userId: string) => {
  try {
    console.log('Fetching profile for user:', userId);
    
    // First ensure the profile exists
    await ensureUserProfile(userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching profile:', error);
      return {
        username: null, 
        avatar_url: null,
        tags: []
      };
    }
    
    // Also fetch tags
    const tags = await fetchUserTags(userId);
    
    console.log('Profile fetched successfully:', data, 'with tags:', tags);
    
    return {
      username: data?.username || null,
      avatar_url: data?.avatar_url || null,
      tags
    };
  } catch (error) {
    console.error('Exception in fetchUserProfile:', error);
    return {
      username: null, 
      avatar_url: null,
      tags: []
    };
  }
};
