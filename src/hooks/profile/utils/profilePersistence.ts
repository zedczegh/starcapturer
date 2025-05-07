
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
    
    if (fetchError) {
      console.log("Error fetching profile:", fetchError);
      return false;
    }
    
    // If profile doesn't exist, create it
    if (!existingProfile) {
      console.log("Creating new profile for user:", userId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("User not authenticated");
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
        console.log("Profile creation info:", insertError);
        return false;
      }
      
      console.log("Profile created successfully for user:", userId);
    } else {
      console.log("Profile already exists for user:", userId);
    }
    
    return true;
  } catch (error) {
    console.log("Error in ensureProfileExists:", error);
    return false;
  }
}

// Fetch user profile
export async function fetchUserProfile(userId: string) {
  try {
    const profileExists = await ensureProfileExists(userId);
    if (!profileExists) {
      console.log("Proceeding with fetch despite profile check issue");
    }
    
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
  } catch (error) {
    console.log("Error in fetchUserProfile:", error);
    return { data: null, error };
  }
}
