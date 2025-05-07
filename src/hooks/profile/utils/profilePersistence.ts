
import { supabase } from '@/integrations/supabase/client';

// Ensure a profile exists for the user
export async function ensureProfileExists(userId: string) {
  try {
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error fetching profile:", fetchError);
      throw fetchError;
    }
    
    // If profile doesn't exist, create it
    if (!existingProfile) {
      console.log("Profile doesn't exist, creating one for user:", userId);
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error("Error creating profile:", insertError);
        throw insertError;
      }
      
      console.log("Profile created successfully for user:", userId);
    } else {
      console.log("Profile already exists for user:", userId);
    }
    
    return true;
  } catch (error) {
    console.error("Error in ensureProfileExists:", error);
    throw error;
  }
}

// Fetch user profile
export async function fetchUserProfile(userId: string) {
  try {
    await ensureProfileExists(userId);
    
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    throw error;
  }
}
