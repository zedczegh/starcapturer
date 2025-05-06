
import { supabase } from '@/integrations/supabase/client';

// This function ensures the avatars storage bucket exists
export async function ensureAvatarsBucketExists() {
  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error checking storage buckets:', bucketsError);
      return false;
    }
    
    const avatarsBucketExists = buckets.some(bucket => bucket.name === 'avatars');
    
    if (!avatarsBucketExists) {
      console.warn('Avatars bucket not found. Creating bucket...');
      const { error: createError } = await supabase.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
      });
      
      if (createError) {
        console.error('Failed to create avatars bucket:', createError);
        return false;
      }
      
      console.log('Avatars bucket created successfully');
    } else {
      console.log('Avatars bucket already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring avatars bucket exists:', error);
    return false;
  }
}
