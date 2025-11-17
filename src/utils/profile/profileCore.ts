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
    
    // Check auth status first for RLS
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('User not authenticated for profile creation', sessionError);
      toast.error('Authentication required', { 
        description: 'Please sign out and sign back in to create your profile.' 
      });
      return false;
    }
    
    // Verify the session user is the same as the requested userId
    if (sessionData.session.user.id !== userId) {
      console.error('Session user ID does not match requested user ID');
      toast.error('Permission error', { 
        description: 'You do not have permission to create this profile. Please sign out and sign in with the correct account.' 
      });
      return false;
    }
    
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
      
      // Try to insert profile with more detailed error handling
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
          toast.error('User authentication error', { description: 'There was an issue with your user account. Please try signing out and in again.' });
          return false;
        }
        
        // Special handling for RLS policy violations
        if (insertError.message.includes('violates row-level security policy')) {
          console.error('RLS policy violation - ensure you are authenticated and have proper permissions');
          toast.error('Permission error', { description: 'You do not have permission to create a profile. Please try signing out and in again.' });
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
    background_image_url?: string | null;
    bio?: string | null;
    motto?: string | null;
  }
): Promise<boolean> => {
  try {
    console.log('Upserting profile for user:', userId, profileData);
    
    // Check auth status first
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('User not authenticated for profile update', sessionError);
      toast.error('Authentication required', { 
        description: 'Please sign in to update your profile' 
      });
      return false;
    }
    
    // Verify the session user is the same as the requested userId
    if (sessionData.session.user.id !== userId) {
      console.error('Session user ID does not match requested user ID');
      toast.error('Permission error', { 
        description: 'You do not have permission to update this profile.' 
      });
      return false;
    }
    
    // First ensure the profile exists
    const profileExists = await ensureUserProfile(userId);
    if (!profileExists) {
      console.error('Failed to ensure profile exists before update');
      return false;
    }
    
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
      
      // Special handling for RLS policy violations
      if (updateError.message.includes('violates row-level security policy')) {
        console.error('RLS policy violation - ensure you are authenticated and have proper permissions');
        toast.error('Permission error', { description: 'You do not have permission to update this profile. Please try signing out and in again.' });
        return false;
      }
      
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
 * Updated to handle viewing other users' profiles
 */
export const fetchUserProfile = async (userId: string) => {
  try {
    console.log('Fetching profile for user:', userId);
    
    // Check auth status for potential RLS issues
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session check error:', sessionError);
    }
    
    // Check if the requested profile is the current user's own profile
    const isOwnProfile = sessionData?.session?.user?.id === userId;
    
    // Only ensure profile exists for own profile
    if (isOwnProfile) {
      await ensureUserProfile(userId);
    }
    
    // Fetch the profile regardless of whether it's our own or another user's
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url, background_image_url, bio, motto')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching profile:', error);
      return {
        username: null, 
        avatar_url: null,
        background_image_url: null,
        bio: null,
        motto: null,
        tags: []
      };
    }
    
    // Also fetch tags
    const tags = await fetchUserTags(userId);
    
    console.log('Profile fetched successfully:', data, 'with tags:', tags);
    
    return {
      username: data?.username || null,
      avatar_url: data?.avatar_url || null,
      background_image_url: data?.background_image_url || null,
      bio: data?.bio || null,
      motto: data?.motto || null,
      tags
    };
  } catch (error) {
    console.error('Exception in fetchUserProfile:', error);
    return {
      username: null, 
      avatar_url: null,
      background_image_url: null,
      bio: null,
      motto: null,
      tags: []
    };
  }
};

export type ProfileData = {
  username: string | null;
  avatar_url: string | null;
  background_image_url?: string | null;
  bio?: string | null;
  motto?: string | null;
  tags: string[];
};
