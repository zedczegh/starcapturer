
import { supabase } from '@/integrations/supabase/client';

// Delegate to the centralized profile function
export async function ensureProfileExists(uid: string): Promise<boolean> {
  try {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("User not authenticated");
      return false;
    }
    
    // Check if profile exists
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', uid)
      .maybeSingle();
    
    if (error) {
      console.log("Error checking profile existence:", error);
      return false;
    }
    
    if (!data) {
      // Create profile if it doesn't exist
      const { error: createError } = await supabase
        .from('profiles')
        .insert([{ 
          id: uid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
        
      if (createError) {
        console.log("Profile creation info:", createError);
        return false;
      }
      
      console.log("Created new profile for user:", uid);
    } else {
      console.log("Profile exists for user:", uid);
    }
    
    return true;
  } catch (err) {
    console.log("Profile check exception:", err);
    return false;
  }
}
