import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Upload a background image file to Supabase storage
 */
export const uploadBackground = async (userId: string, file: File): Promise<string | null> => {
  console.log('=== STARTING BACKGROUND UPLOAD ===');
  console.log('User ID:', userId);
  console.log('File:', { name: file.name, size: file.size, type: file.type });
  
  if (!userId) {
    console.error('uploadBackground called with empty userId');
    toast.error('Background upload failed', { description: 'Invalid user ID' });
    return null;
  }

  try {
    // Check auth status first for RLS
    console.log('Checking authentication...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      toast.error('Authentication error', { description: sessionError.message });
      return null;
    }
    
    if (!sessionData.session) {
      console.error('No active session found');
      toast.error('Authentication required', { description: 'Please sign in to upload a background' });
      return null;
    }
    
    console.log('Auth check passed. Session user:', sessionData.session.user.id);
    
    // Verify the session user is the same as the requested userId
    if (sessionData.session.user.id !== userId) {
      console.error('Session user ID does not match requested user ID');
      console.error('Session user:', sessionData.session.user.id, 'Requested user:', userId);
      toast.error('Permission error', { 
        description: 'You do not have permission to upload for this user.' 
      });
      return null;
    }

    console.log('User ID verification passed');
    
    // Validate the file - support all image formats
    console.log('Validating file type...');
    if (!file || !file.type.startsWith('image/')) {
      console.error('Invalid file type:', file?.type);
      toast.error('Invalid file type', { description: 'Please select an image file' });
      return null;
    }
    console.log('File type valid:', file.type);

    // Check file size - max 300MB
    const maxSize = 300 * 1024 * 1024; // 300MB in bytes
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log('File size:', fileSizeMB, 'MB / Max:', '300 MB');
    
    if (file.size > maxSize) {
      console.error('File too large:', fileSizeMB, 'MB');
      toast.error('File too large', { 
        description: `Maximum file size is 300MB. Your file is ${fileSizeMB}MB` 
      });
      return null;
    }

    // Generate unique filename to prevent conflicts
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/background-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    console.log('Generated filename:', fileName);
    console.log('Starting upload to storage...');
    
    // Upload the file to avatars bucket (reusing existing bucket)
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { 
        upsert: true,
        contentType: file.type
      });
    
    console.log('Upload response:', { data, error: uploadError });
      
    if (uploadError) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error details:', JSON.stringify(uploadError, null, 2));
      console.error('Error message:', uploadError.message);
      console.error('Error name:', uploadError.name);
      
      // Special handling for RLS policy violations
      if (uploadError.message.includes('violates row-level security policy') || 
          uploadError.message.includes('row-level security') ||
          uploadError.message.includes('policy')) {
        console.error('RLS POLICY VIOLATION DETECTED');
        toast.error('Permission error', { 
          description: 'Storage permission denied. Please refresh and try again.' 
        });
        return null;
      }
      
      // Handle file size errors
      if (uploadError.message.includes('size') || uploadError.message.includes('large')) {
        console.error('FILE SIZE ERROR');
        toast.error('File too large', { description: 'Please try a smaller file (max 300MB)' });
        return null;
      }
      
      // Show generic error
      toast.error('Background upload failed', { 
        description: uploadError.message || 'Unknown error occurred'
      });
      return null;
    }
    
    console.log('Upload successful! Getting public URL...');
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
      
    console.log('=== UPLOAD COMPLETE ===');
    console.log('Public URL:', publicUrl);
    toast.success('Background uploaded successfully');
    return publicUrl;
  } catch (error: any) {
    console.error('=== EXCEPTION IN UPLOAD ===');
    console.error('Exception details:', error);
    console.error('Stack trace:', error.stack);
    toast.error('Background upload failed', { 
      description: error.message || 'An unexpected error occurred'
    });
    return null;
  }
};
