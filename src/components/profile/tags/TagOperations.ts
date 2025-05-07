
import { supabase } from '@/integrations/supabase/client';
import { ensureProfileExists } from './ProfileUtils';
import { UserTag } from './UserTagsTypes';

// Add a tag for a specific user
export async function addTagForUser(uid: string, tagName: string): Promise<any> {
  try {
    if (!await ensureProfileExists(uid)) {
      console.log("Proceeding with tag addition despite profile check issue");
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
      console.log("Tag addition info:", error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.log("Tag addition exception:", err);
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
      console.log("Tag removal info:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.log("Tag removal exception:", err);
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
      console.log("Profile doesn't exist for user:", userId);
    }
    
    // Now fetch tags
    const { data: tagData, error } = await supabase
      .from('profile_tags')
      .select('id, tag')
      .eq('user_id', userId);
      
    if (error) {
      console.log("Tag fetch info:", error);
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
    console.log("Tag fetch exception:", err);
    return [];
  }
}
