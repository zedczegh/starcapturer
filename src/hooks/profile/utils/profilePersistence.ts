
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
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error fetching profile:", fetchError);
      
      if (fetchError.message?.includes('JWT expired')) {
        toast.error('Your session has expired. Please log in again.');
        // Force refresh auth state
        await supabase.auth.refreshSession();
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          throw new Error('Authentication required');
        }
      } else {
        throw fetchError;
      }
    }
    
    // If profile doesn't exist, create it
    if (!existingProfile) {
      console.log("Profile doesn't exist, creating one for user:", userId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("User not authenticated");
        throw new Error('Authentication required');
      }
      
      // Verify this is the current user's profile
      if (session.user.id !== userId) {
        console.error("Cannot create profile for another user");
        throw new Error('Unauthorized operation');
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
        if (insertError.message.includes('violates row-level security policy')) {
          throw new Error('Permission denied - Row Level Security restriction');
        }
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
