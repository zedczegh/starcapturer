
import { supabase } from '@/integrations/supabase/client';
import { ensureProfileExists } from './ProfileUtils';
import { UserTag } from './UserTagsTypes';

// Add a tag for a specific user
export async function addTagForUser(uid: string, tagName: string): Promise<any> {
  try {
    if (!await ensureProfileExists(uid)) {
      console.error("Failed to ensure profile exists");
      return null;
    }
    
    // Check if tag already exists
    const { data: existingTags } = await supabase
      .from('profile_tags')
      .select('id, tag')
      .eq('user_id', uid)
      .eq('tag', tagName);
      
    if (existingTags && existingTags.length > 0) {
      console.log(`Tag "${tagName}" already exists for user ${uid}`);
      return existingTags[0];
    }
    
    // Add the tag
    const { data, error } = await supabase
      .from('profile_tags')
      .insert({ user_id: uid, tag: tagName })
      .select()
      .single();
      
    if (error) {
      console.error("Error adding tag:", error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error("Error adding tag:", err);
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
      console.error("Error removing tag:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error removing tag:", err);
    return false;
  }
}

// Fetch tags for a specific user
export async function fetchTagsForUser(userId: string): Promise<UserTag[]> {
  try {
    console.log("Fetching tags for user:", userId);
    
    // Ensure the user has a profile
    const profileExists = await ensureProfileExists(userId);
    if (!profileExists) {
      console.error("Profile doesn't exist for user:", userId);
      return [];
    }
    
    // Now fetch tags
    const { data: tagData, error } = await supabase
      .from('profile_tags')
      .select('id, tag')
      .eq('user_id', userId);
      
    if (error) {
      console.error("Error fetching tags:", error);
      return [];
    }
    
    if (tagData) {
      const fetchedTags = tagData.map(item => ({
        id: item.id,
        name: item.tag,
        icon_url: null
      }));
      
      console.log(`Fetched ${fetchedTags.length} tags for user:`, userId);
      return fetchedTags;
    }
    
    return [];
  } catch (err) {
    console.error("Error fetching tags:", err);
    return [];
  }
}
