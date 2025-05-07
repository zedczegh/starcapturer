
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Upsert a user's profile - handles both creation and update with proper RLS handling
 */
export const upsertUserProfile = async (
  userId: string,
  profileData: {
    username?: string | null;
    avatar_url?: string | null;
  }
): Promise<boolean> => {
  try {
    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    // If RLS is preventing queries, we need to handle it differently
    if (existingProfile) {
      // Update existing profile
      const { error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating profile:', error);
        return false;
      }
    } else {
      // Create new profile
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error inserting profile:', error);
        // Special case: if the error is about RLS, the profile likely exists but RLS prevents us from seeing it
        // In this case, try an update instead
        if (error.code === '42501') {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              ...profileData,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
          if (updateError) {
            console.error('Error in fallback update:', updateError);
            return false;
          }
          return true;
        }
        return false;
      }
    }
    
    return true;
  } catch (error: any) {
    console.error('Error upserting profile:', error);
    return false;
  }
};

/**
 * Upload an avatar file to Supabase storage
 */
export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);
      
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
      
    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    toast.error('Avatar upload failed', { description: error.message });
    return null;
  }
};

/**
 * Save tags for a user profile
 */
export const saveUserTags = async (userId: string, tags: string[]): Promise<boolean> => {
  try {
    // First delete existing tags
    const { error: deleteError } = await supabase
      .from('profile_tags')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) {
      console.error('Error deleting tags:', deleteError);
      // If RLS prevented deletion, we'll try the insertions anyway
    }
    
    // If no tags to insert, we're done
    if (tags.length === 0) return true;
    
    // Insert new tags
    const tagRows = tags.map((tag) => ({
      user_id: userId,
      tag,
    }));
    
    const { error: insertError } = await supabase
      .from('profile_tags')
      .insert(tagRows);
      
    if (insertError) {
      console.error('Error saving profile tags:', insertError);
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.error('Error saving profile tags:', error);
    return false;
  }
};

/**
 * Fetch profile tags for a user
 */
export const fetchUserTags = async (userId: string): Promise<string[]> => {
  try {
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
    console.error('Error fetching user tags:', error);
    return [];
  }
};

/**
 * Fetch a user's profile data
 */
export const fetchUserProfile = async (userId: string) => {
  try {
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
    
    return {
      username: data?.username || null,
      avatar_url: data?.avatar_url || null,
      tags
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return {
      username: null, 
      avatar_url: null,
      tags: []
    };
  }
};
