import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Upload a background image file to Supabase storage
 */
export const uploadBackground = async (userId: string, file: File): Promise<string | null> => {
  if (!userId) {
    toast.error('Background upload failed', { description: 'Invalid user ID' });
    return null;
  }

  try {
    // Check auth status first for RLS
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      toast.error('Authentication error', { description: sessionError.message });
      return null;
    }
    
    if (!sessionData.session) {
      toast.error('Authentication required', { description: 'Please sign in to upload a background' });
      return null;
    }
    
    // Verify the session user is the same as the requested userId
    if (sessionData.session.user.id !== userId) {
      toast.error('Permission error', { 
        description: 'You do not have permission to upload for this user.' 
      });
      return null;
    }
    
    // Validate the file - support all image formats
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Invalid file type', { description: 'Please select an image file' });
      return null;
    }

    // Check file size - max 100MB
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    
    if (file.size > maxSize) {
      toast.error('File too large', { 
        description: `Maximum file size is 100MB. Your file is ${fileSizeMB}MB` 
      });
      return null;
    }

    // Generate unique filename to prevent conflicts
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/background-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Upload the file to avatars bucket (reusing existing bucket)
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { 
        upsert: true,
        contentType: file.type
      });
      
    if (uploadError) {
      // Special handling for RLS policy violations
      if (uploadError.message.includes('violates row-level security policy') || 
          uploadError.message.includes('row-level security') ||
          uploadError.message.includes('policy')) {
        toast.error('Permission error', { 
          description: 'Storage permission denied. Please refresh and try again.' 
        });
        return null;
      }
      
      // Handle file size errors
      if (uploadError.message.includes('size') || uploadError.message.includes('large')) {
        toast.error('File too large', { description: 'Please try a smaller file (max 100MB)' });
        return null;
      }
      
      // Show generic error
      toast.error('Background upload failed', { 
        description: uploadError.message || 'Unknown error occurred'
      });
      return null;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
      
    toast.success('Background uploaded successfully');
    return publicUrl;
  } catch (error: any) {
    toast.error('Background upload failed', { 
      description: error.message || 'An unexpected error occurred'
    });
    return null;
  }
};
