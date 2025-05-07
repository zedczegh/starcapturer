
import { supabase } from '@/integrations/supabase/client';

// Helper function to ensure user profile exists
export async function ensureProfileExists(userId: string): Promise<boolean> {
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
}

// Fetch a user's profile data
export async function fetchUserProfile(userId: string) {
  try {
    // First ensure profile exists
    await ensureProfileExists(userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
    
    return { data, error };
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    throw error;
  }
}

// Update a user's profile data
export async function updateUserProfile(userId: string, updates: {
  username?: string;
  avatar_url?: string | null;
}) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('username, avatar_url')
      .single();
      
    if (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
    
    return { data, error };
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    throw error;
  }
}
