
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Ensure a profile exists for the user
export async function ensureProfileExists(userId: string) {
  try {
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.log("Error fetching profile:", fetchError);
      return false;
    }
    
    // If profile doesn't exist, create it
    if (!existingProfile) {
      console.log("Profile doesn't exist, creating one for user:", userId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("User not authenticated");
        return false;
      }
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        // Don't log RLS-related errors as critical errors
        if (insertError.message.includes('violates row-level security') || 
            insertError.message.includes('permission denied')) {
          console.log("Profile creation blocked by RLS - this might be expected behavior");
        } else {
          console.error("Error creating profile:", insertError);
        }
        return false;
      }
      
      console.log("Profile created successfully for user:", userId);
    } else {
      console.log("Profile already exists for user:", userId);
    }
    
    return true;
  } catch (error) {
    console.error("Error in ensureProfileExists:", error);
    return false;
  }
}

// Fetch user profile
export async function fetchUserProfile(userId: string) {
  try {
    const profileExists = await ensureProfileExists(userId);
    if (!profileExists) {
      console.log("Failed to ensure profile exists - proceeding with fetch anyway");
    }
    
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    return { data: null, error };
  }
}
