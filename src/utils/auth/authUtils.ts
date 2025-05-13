
import { supabase } from '@/integrations/supabase/client';

/**
 * Verify if a user is currently authenticated
 * @returns Promise<boolean> Whether user is authenticated or not
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
    return !!data.session?.user;
  } catch (error) {
    console.error('Exception checking auth status:', error);
    return false;
  }
}

/**
 * Refresh the current user session
 * @returns Promise<boolean> Whether refresh was successful
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
    return !!data.session;
  } catch (error) {
    console.error('Exception refreshing session:', error);
    return false;
  }
}

/**
 * Get the current authenticated user
 * @returns Promise with the current user or null
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    return data.user;
  } catch (error) {
    console.error('Exception getting current user:', error);
    return null;
  }
}
