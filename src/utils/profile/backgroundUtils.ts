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
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`[Background Upload] Starting upload - File size: ${fileSizeMB}MB (${file.size} bytes)`);
    
    // Check auth status first for RLS
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[Background Upload] Session error:', sessionError);
      toast.error('Authentication error', { description: sessionError.message });
      return null;
    }
    
    if (!sessionData.session) {
      console.error('[Background Upload] No active session');
      toast.error('Authentication required', { description: 'Please sign in to upload a background' });
      return null;
    }
    
    // Verify the session user is the same as the requested userId
    if (sessionData.session.user.id !== userId) {
      console.error('[Background Upload] User ID mismatch');
      toast.error('Permission error', { 
        description: 'You do not have permission to upload for this user.' 
      });
      return null;
    }
    
    // Validate the file - support all image formats
    if (!file || !file.type.startsWith('image/')) {
      console.error('[Background Upload] Invalid file type:', file?.type);
      toast.error('Invalid file type', { description: 'Please select an image file' });
      return null;
    }

    // Check file size - max 100MB
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    
    console.log(`[Background Upload] File size check - File: ${file.size}, Max: ${maxSize}, Pass: ${file.size <= maxSize}`);
    
    if (file.size > maxSize) {
      console.error(`[Background Upload] File too large: ${fileSizeMB}MB`);
      toast.error('File too large', { 
        description: `Maximum file size is 100MB. Your file is ${fileSizeMB}MB` 
      });
      return null;
    }
    
    console.log('[Background Upload] All validation checks passed');

    // Generate unique filename to prevent conflicts
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/background-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    console.log(`[Background Upload] Uploading to storage - Path: ${fileName}`);
    
    // Upload the file to avatars bucket (reusing existing bucket)
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { 
        upsert: true,
        contentType: file.type
      });
      
    console.log('[Background Upload] Upload response:', { data, error: uploadError });
      
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
