
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
      console.error("Error fetching profile:", fetchError);
      
      if (fetchError.message?.includes('JWT expired')) {
        // Only show critical auth errors
        toast.error('Your session has expired. Please log in again.');
        await supabase.auth.refreshSession();
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          throw new Error('Authentication required');
        }
      } else {
        // Log error but don't display toast
        console.error(fetchError);
      }
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
        console.error("Error creating profile:", insertError);
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
      console.error("Failed to ensure profile exists");
      return { data: null, error: new Error("Failed to ensure profile exists") };
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
