
import { supabase } from '@/integrations/supabase/client';
import { ensureUserProfile } from './profileCore';

/**
 * Save tags for a user profile with better error handling
 */
export const saveUserTags = async (userId: string, tags: string[]): Promise<boolean> => {
  try {
    console.log('Saving tags for user:', userId, tags);
    
    // First ensure the profile exists
    await ensureUserProfile(userId);
    
    // First delete existing tags
    const { error: deleteError } = await supabase
      .from('profile_tags')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) {
      console.error('Error deleting tags:', deleteError);
      // Continue anyway as this might be due to no existing tags
    }
    
    // If no tags to insert, we're done
    if (tags.length === 0) return true;
    
    // Insert new tags in a batch to improve performance
    const tagsToInsert = tags.map(tag => ({
      user_id: userId,
      tag
    }));
    
    const { error: insertError } = await supabase
      .from('profile_tags')
      .insert(tagsToInsert);
        
    if (insertError) {
      console.error('Error saving tags:', insertError);
      return false;
    }
    
    console.log('Tags saved successfully for user:', userId);
    return true;
  } catch (error: any) {
    console.error('Exception in saveUserTags:', error);
    return false;
  }
};

/**
 * Fetch profile tags for a user with better error handling
 */
export const fetchUserTags = async (userId: string): Promise<string[]> => {
  try {
    console.log('Fetching tags for user:', userId);
    
    const { data, error } = await supabase
      .from('profile_tags')
      .select('tag')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching user tags:', error);
      return [];
    }
    
    return data ? data.map(item => item.tag) : [];
  } catch (error) {
    console.error('Exception in fetchUserTags:', error);
    return [];
  }
};
