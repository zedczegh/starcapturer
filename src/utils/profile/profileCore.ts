import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { fetchUserTags } from './profileTagUtils';

/**
 * Check if a user profile exists and create one if it doesn't
 * With improved error handling and robust validation
 */
export const ensureUserProfile = async (
  userId: string
): Promise<boolean> => {
  if (!userId) {
    console.error('ensureUserProfile called with empty userId');
    return false;
  }

  try {
    console.log('Checking if profile exists for user:', userId);
    
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
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
        
        // Special handling for "Foreign key violation" errors, which often indicate the user doesn't exist in auth.users
        if (insertError.message.includes('foreign key') || insertError.code === '23503') {
          console.error('Foreign key violation - user may not exist in auth.users table');
          toast.error('User authentication error', { description: 'There was an issue with your user account' });
          return false;
        }
        
        toast.error('Profile creation failed', { description: insertError.message });
        return false;
      }
      
      console.log('Successfully created new profile for user:', userId);
      return true;
    } else {
      console.log('Profile already exists for user:', userId);
      return true;
    }
  } catch (error: any) {
    console.error('Exception in ensureUserProfile:', error);
    toast.error('Profile check failed', { description: error.message });
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

export type ProfileData = {
  username: string | null;
  avatar_url: string | null;
  tags: string[];
};
