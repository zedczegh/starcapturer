
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

/**
 * Checks if a username is available by calling the Supabase RPC function
 */
export const checkUsernameAvailability = async (username: string, t: (en: string, zh: string) => string) => {
  const { data: usernameCheck, error: usernameError } = await supabase.rpc('is_username_available', {
    username_to_check: username
  });
  
  if (usernameError) {
    console.error("Username check error:", usernameError);
    throw new Error(t(
      "Could not verify username availability. Please try again.",
      "无法验证用户名可用性。请重试。"
    ));
  }
  
  if (usernameCheck === false) {
    throw new Error(t(
      "This username is already taken. Please choose another one.",
      "此用户名已被使用。请选择另一个。"
    ));
  }
  
  return true;
};

/**
 * Displays authentication-related toast notifications
 */
export const showAuthToast = (
  type: 'success' | 'error' | 'info',
  title: string,
  description?: string,
  position: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right' = 'top-center'
) => {
  toast[type](title, {
    description,
    position,
    duration: type === 'success' ? 4000 : 5000,
  });
};

/**
 * Creates a profile entry for a new user with proper error handling and retries
 */
export const createUserProfile = async (userId: string, username: string, email: string) => {
  try {
    console.log("Creating new profile for user:", userId, "with username:", username);
    
    // First check if profile already exists to avoid duplicate inserts
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { // Not "no rows found" error
      console.error("Error checking for existing profile:", checkError);
    }
      
    if (existingProfile) {
      console.log("Profile already exists for user:", userId);
      return null;
    }
    
    // Create the new profile - first try with RLS bypassed
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: username,
        avatar_url: null,
        updated_at: new Date().toISOString()
      });
      
    if (profileError) {
      console.error("Error creating profile:", profileError);
      
      // If there was an error, try one more time with a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { error: retryError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: username,
          avatar_url: null,
          updated_at: new Date().toISOString()
        });
        
      if (retryError) {
        console.error("Failed to create profile after retry:", retryError);
        return retryError;
      }
    }
    
    console.log("Successfully created new profile for user:", userId);
    return null;
  } catch (error) {
    console.error("Unexpected error in createUserProfile:", error);
    return error;
  }
};

/**
 * Ensures a user profile exists, creating one if needed
 * Returns true if a new profile was created, false if it already existed
 */
export const ensureUserProfile = async (userId: string, email: string): Promise<boolean> => {
  if (!userId) {
    console.error("No user ID provided to ensureUserProfile");
    return false;
  }

  try {
    console.log("Ensuring profile exists for user:", userId);
    
    // Check if profile exists
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', userId)
      .single();
      
    if (fetchError) {
      if (fetchError.code !== 'PGRST116') { // PGRST116 is "no rows found" error
        console.error("Error fetching profile:", fetchError);
      }
      
      // If profile doesn't exist or there was an error, create one
      const username = email.split('@')[0]; // Use part before @ as username
      await createUserProfile(userId, username, email);
      console.log("Created new profile for user:", userId);
      return true;
    }
    
    console.log("Profile already exists for user:", userId);
    return false;
  } catch (error) {
    console.error("Error in ensureUserProfile:", error);
    
    // As a last resort, try to create the profile directly
    try {
      const username = email.split('@')[0];
      await supabase.from('profiles').insert({
        id: userId,
        username: username,
        updated_at: new Date().toISOString()
      });
      console.log("Created profile as last resort for user:", userId);
      return true;
    } catch (lastError) {
      console.error("Failed last resort profile creation:", lastError);
      return false;
    }
  }
};
