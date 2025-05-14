
import { supabase } from '@/integrations/supabase/client';

/**
 * Ensures a user profile exists in the database
 * @param userId The user's ID
 * @returns Promise<boolean> Whether the profile exists or was created
 */
export async function ensureUserProfile(userId: string): Promise<boolean> {
  try {
    console.log('Ensuring user profile exists for:', userId);
    
    // First check if the profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error fetching user profile:', fetchError);
      return false;
    }
    
    // If profile exists, we're done
    if (existingProfile) {
      console.log('Profile already exists for user:', userId);
      return true;
    }

    // Get user data to populate profile
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user data for profile creation:', userError);
      return false;
    }
    
    // Create the profile
    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: user.email,
        username: user.email?.split('@')[0] || `user_${Date.now().toString(36)}`,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating user profile:', insertError);
      return false;
    }
    
    console.log('Created new profile for user:', userId);
    return true;
  } catch (error) {
    console.error('Exception ensuring user profile exists:', error);
    return false;
  }
}

/**
 * Fetches a user's profile data
 * @param userId The user's ID
 * @returns Promise with the user profile data or null
 */
export async function fetchUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception fetching user profile:', error);
    return null;
  }
}
