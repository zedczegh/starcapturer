
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
 * Creates a profile entry for a new user
 */
export const createUserProfile = async (userId: string, username: string, email: string) => {
  // First check if profile already exists to avoid duplicate inserts
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();
    
  if (existingProfile) {
    console.log("Profile already exists for user:", userId);
    return null;
  }
  
  console.log("Creating new profile for user:", userId, "with username:", username);
  
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
    return profileError;
  }
  
  return null;
};

/**
 * Ensures a user profile exists, creating one if needed
 */
export const ensureUserProfile = async (userId: string, email: string) => {
  // Check if profile exists
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('id', userId)
    .single();
    
  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows found" error
    console.error("Error fetching profile:", fetchError);
    return;
  }
  
  // If profile doesn't exist, create one with email as username
  if (!profile) {
    const username = email.split('@')[0]; // Use part before @ as username
    await createUserProfile(userId, username, email);
    console.log("Created new profile for existing user:", userId);
  }
};
