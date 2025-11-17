import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Upload a background image file to Supabase storage
 */
export const uploadBackground = async (userId: string, file: File): Promise<string | null> => {
  if (!userId) {
    console.error('uploadBackground called with empty userId');
    toast.error('Background upload failed', { description: 'Invalid user ID' });
    return null;
  }

  try {
    // Check auth status first for RLS
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('User not authenticated for background upload', sessionError);
      toast.error('Authentication required', { description: 'Please sign in to upload a background' });
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

    console.log('Uploading background for user:', userId);
    
    // Validate the file - support all image formats
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Invalid file type', { description: 'Please select an image file' });
      return null;
    }

    // Check file size - max 300MB
    const maxSize = 300 * 1024 * 1024; // 300MB in bytes
    if (file.size > maxSize) {
      toast.error('File too large', { 
        description: `Maximum file size is 300MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB` 
      });
      return null;
    }

    // Generate unique filename to prevent conflicts
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/background-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    console.log('Uploading background with filename:', fileName, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    
    // Upload the file to avatars bucket (reusing existing bucket)
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { 
        upsert: true,
        contentType: file.type
      });
      
    if (uploadError) {
      console.error('Error uploading background:', uploadError);
      
      // Special handling for RLS policy violations
      if (uploadError.message.includes('violates row-level security policy')) {
        toast.error('Permission error', { description: 'You do not have permission to upload this background. Please try signing out and in again.' });
        return null;
      }
      
      // Handle file size errors
      if (uploadError.message.includes('size') || uploadError.message.includes('large')) {
        toast.error('File too large', { description: 'Please try a smaller file (max 300MB)' });
        return null;
      }
      
      toast.error('Background upload failed', { description: uploadError.message });
      return null;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
      
    console.log('Background uploaded successfully, public URL:', publicUrl);
    toast.success('Background uploaded successfully');
    return publicUrl;
  } catch (error: any) {
    console.error('Exception in uploadBackground:', error);
    toast.error('Background upload failed', { description: error.message });
    return null;
  }
};
