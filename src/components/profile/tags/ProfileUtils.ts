
import { supabase } from '@/integrations/supabase/client';

// Helper function to ensure user profile exists
export async function ensureProfileExists(uid: string): Promise<boolean> {
  try {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if profile exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', uid)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking profile existence:", error);
      return false;
    }
    
    if (!data) {
      // Only allow creating a profile for the current user
      if (!session || session.user.id !== uid) {
        console.error("Cannot create profile for another user");
        return false;
      }
      
      // Create profile if doesn't exist
      const { error: createError } = await supabase
        .from('profiles')
        .insert([{ id: uid }]);
        
      if (createError) {
        console.error("Error creating profile:", createError);
        return false;
      }
      
      console.log("Created new profile for user:", uid);
    }
    
    return true;
  } catch (err) {
    console.error("Failed to ensure profile exists:", err);
    return false;
  }
}
