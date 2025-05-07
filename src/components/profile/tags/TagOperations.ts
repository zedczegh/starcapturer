
import { supabase } from '@/integrations/supabase/client';
import { ensureProfileExists } from './ProfileUtils';
import { UserTag } from './UserTagsTypes';

// Add a tag for a specific user
export async function addTagForUser(uid: string, tagName: string): Promise<any> {
  try {
    if (!await ensureProfileExists(uid)) {
      return null;
    }
    
    // Check if tag already exists
    const { data: existingTags } = await supabase
      .from('profile_tags')
      .select('id, tag')
      .eq('user_id', uid)
      .eq('tag', tagName);
      
    if (existingTags && existingTags.length > 0) {
      return existingTags[0];
    }
    
    // Add the tag
    const { data, error } = await supabase
      .from('profile_tags')
      .insert({ user_id: uid, tag: tagName })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error("Error adding tag directly:", err);
    return null;
  }
}

// Remove a tag
export async function removeTagForUser(tagId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profile_tags')
      .delete()
      .eq('id', tagId);
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (err) {
    console.error("Error removing tag directly:", err);
    return false;
  }
}

// Fetch tags for a specific user
export async function fetchTagsForUser(userId: string): Promise<UserTag[]> {
  try {
    console.log("Directly fetching tags for user:", userId);
    
    // Ensure the user has a profile
    await ensureProfileExists(userId);
    
    // Now fetch tags
    const { data: tagData, error } = await supabase
      .from('profile_tags')
      .select('id, tag')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    if (tagData) {
      const fetchedTags = tagData.map(item => ({
        id: item.id,
        name: item.tag,
        icon_url: null
      }));
      
      console.log(`Directly fetched ${fetchedTags.length} tags for user:`, userId);
      return fetchedTags;
    }
    
    return [];
  } catch (err) {
    console.error("Error directly fetching tags:", err);
    return [];
  }
}
