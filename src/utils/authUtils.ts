
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
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      username: username,
      email: email
    });
    
  if (profileError) {
    console.error("Error creating profile:", profileError);
    // We return the error but continue as auth was successful
    return profileError;
  }
  
  return null;
};
