
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Upload an avatar file to Supabase storage with better error handling
 */
export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
  if (!userId) {
    console.error('uploadAvatar called with empty userId');
    toast.error('Avatar upload failed', { description: 'Invalid user ID' });
    return null;
  }

  try {
    // Check auth status first for RLS
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('User not authenticated for avatar upload', sessionError);
      toast.error('Authentication required', { description: 'Please sign in to upload an avatar' });
      return null;
    }
    
    // Verify the session user is the same as the requested userId
    if (sessionData.session.user.id !== userId) {
      console.error('Session user ID does not match requested user ID');
      toast.error('Permission error', { 
        description: 'You do not have permission to upload for this user.' 
      });
      return null;
    }

    console.log('Uploading avatar for user:', userId);
    
    // Validate the file
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Invalid file type', { description: 'Please select an image file' });
      return null;
    }

    // Generate unique filename to prevent conflicts
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    console.log('Uploading avatar with filename:', fileName);
    
    // Upload the file
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });
      
    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      
      // Special handling for RLS policy violations
      if (uploadError.message.includes('violates row-level security policy')) {
        toast.error('Permission error', { description: 'You do not have permission to upload this avatar. Please try signing out and in again.' });
        return null;
      }
      
      toast.error('Avatar upload failed', { description: uploadError.message });
      return null;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
      
    console.log('Avatar uploaded successfully, public URL:', publicUrl);
    toast.success('Avatar updated successfully');
    return publicUrl;
  } catch (error: any) {
    console.error('Exception in uploadAvatar:', error);
    toast.error('Avatar upload failed', { description: error.message });
    return null;
  }
};

/**
 * Remove an avatar and delete the file from storage
 */
export const removeAvatar = async (userId: string, avatarUrl: string | null): Promise<boolean> => {
  if (!userId) {
    console.error('removeAvatar called with empty userId');
    return false;
  }

  if (!avatarUrl) {
    // No avatar to delete, just return success
    return true;
  }

  try {
    // Check auth status first for RLS
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('User not authenticated for avatar removal', sessionError);
      toast.error('Authentication required', { description: 'Please sign in to remove an avatar' });
      return false;
    }
    
    // Verify the session user is the same as the requested userId
    if (sessionData.session.user.id !== userId) {
      console.error('Session user ID does not match requested user ID');
      toast.error('Permission error', { 
        description: 'You do not have permission to remove this avatar' 
      });
      return false;
    }
    
    // Extract the path from the URL
    const urlObj = new URL(avatarUrl);
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts.slice(pathParts.indexOf('avatars') + 1).join('/');

    if (fileName) {
      console.log('Removing avatar file:', fileName);
      const { error } = await supabase.storage
        .from('avatars')
        .remove([fileName]);

      if (error) {
        console.error('Error removing avatar file:', error);
        
        // Special handling for RLS policy violations
        if (error.message.includes('violates row-level security policy')) {
          toast.error('Permission error', { description: 'You do not have permission to delete this avatar' });
          return false;
        }
        
        // Continue anyway, so we can still update the profile
        toast.warning('Failed to delete avatar file', { description: 'The profile will still be updated, but the file may remain on the server' });
      }
    }

    return true;
  } catch (error: any) {
    console.error('Exception in removeAvatar:', error);
    toast.error('Avatar removal failed', { description: error.message });
    return false;
  }
};
