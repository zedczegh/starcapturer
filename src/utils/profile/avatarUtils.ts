
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Upload an avatar file to Supabase storage with better error handling
 */
export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
  try {
    console.log('Uploading avatar for user:', userId);
    
    // Generate unique filename to prevent conflicts
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    console.log('Uploading avatar with filename:', fileName);
    
    // Upload the file - no need to check if bucket exists anymore since we created it
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });
      
    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      toast.error('Avatar upload failed', { description: uploadError.message });
      return null;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
      
    console.log('Avatar uploaded successfully, public URL:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error('Exception in uploadAvatar:', error);
    toast.error('Avatar upload failed', { description: error.message });
    return null;
  }
};
