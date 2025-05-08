
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates the comment_images bucket if it doesn't exist
 */
export const createCommentImagesBucketIfNeeded = async (): Promise<boolean> => {
  try {
    // First check authentication status
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.log("User is not authenticated, cannot check/create bucket");
      return false;
    }
    
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'comment_images');
    
    if (!bucketExists) {
      // This will likely fail for most users as they don't have admin rights
      // but we'll try anyway in case they do
      console.log("comment_images bucket doesn't exist, attempting to create it");
      const { error } = await supabase.storage.createBucket('comment_images', {
        public: true
      });
      
      if (error) {
        console.error("Error creating comment_images bucket:", error);
        return false;
      }
      console.log("Created comment_images bucket successfully");
    }
    
    // Try to list files to verify access permissions
    const { error: listError } = await supabase.storage
      .from('comment_images')
      .list('', { limit: 1 });
    
    if (listError && listError.message !== 'The resource was not found') {
      console.error("Error accessing comment_images bucket:", listError);
      return false;
    }
    
    console.log("comment_images bucket is accessible");
    return true;
  } catch (error) {
    console.error("Exception in createCommentImagesBucketIfNeeded:", error);
    return false;
  }
};

/**
 * Checks if a bucket exists and is accessible for the current user
 */
export const ensureCommentImagesBucket = async (): Promise<boolean> => {
  try {
    console.log("Checking if comment_images bucket is accessible...");
    
    // First check authentication status
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.log("User is not authenticated, cannot check bucket");
      return false;
    }
    
    // Check if the bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error("Error listing buckets:", bucketError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'comment_images');
    if (!bucketExists) {
      console.error("comment_images bucket doesn't exist");
      return false;
    }
    
    // Try to list files to verify access permissions
    const { error } = await supabase.storage
      .from('comment_images')
      .list('', { limit: 1 });
    
    // If there's no error or just a "resource not found" error (empty bucket),
    // the bucket should be accessible
    const isAccessible = !error || error.message === 'The resource was not found';
    
    console.log(`comment_images bucket is ${isAccessible ? 'accessible' : 'not accessible'}`);
    return isAccessible;
  } catch (error) {
    console.error("Exception in ensureCommentImagesBucket:", error);
    return false;
  }
};

/**
 * Uploads an image to the comment_images bucket and returns the public URL
 */
export const uploadCommentImage = async (
  imageFile: File, 
  t: (key: string, fallback: string) => string
): Promise<string | null> => {
  if (!imageFile) return null;
  
  try {
    console.log(`Starting upload process for image: ${imageFile.name}, size: ${imageFile.size} bytes`);
    
    // Check authentication status
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session) {
      console.error("User is not authenticated, cannot upload image");
      toast.error(t("You must be logged in to upload images", "您必须登录才能上传图片"));
      return null;
    }
    
    // Verify bucket exists and is accessible with a fresh check
    const bucketReady = await ensureCommentImagesBucket();
    if (!bucketReady) {
      // Try to create bucket if it doesn't exist
      const created = await createCommentImagesBucketIfNeeded();
      if (!created) {
        console.error("Failed to access or create comment_images bucket");
        toast.error(t("Image storage is temporarily unavailable", "图片存储暂时不可用"));
        return null;
      }
    }
    
    // Generate unique filename with UUID
    const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const sanitizedExt = fileExt.replace(/[^a-z0-9]/g, '');
    const timestamp = new Date().getTime();
    const uniqueId = uuidv4().substring(0, 8);
    const fileName = `${timestamp}-${uniqueId}.${sanitizedExt || 'jpg'}`;
    
    console.log(`Uploading image as: ${fileName}, size: ${imageFile.size} bytes, type: ${imageFile.type}`);
    
    // Upload the image
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('comment_images')
      .upload(fileName, imageFile, {
        contentType: imageFile.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error("Error uploading comment image:", uploadError);
      
      if (uploadError.message.includes("storage quota")) {
        toast.error(t("Storage quota exceeded", "存储配额已超出"));
      } else if (uploadError.message.includes("permission") || uploadError.message.includes("not allowed")) {
        toast.error(t("Permission denied for image upload", "图片上传权限被拒绝"));
      } else {
        toast.error(t("Failed to upload image", "图片上传失败"));
      }
      return null;
    }
    
    console.log("Upload successful, getting public URL");
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('comment_images')
      .getPublicUrl(fileName);
    
    if (!publicUrlData?.publicUrl) {
      console.error("Failed to get public URL for image");
      return null;
    }
    
    console.log("Image uploaded successfully, public URL:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("Exception during comment image upload:", err);
    toast.error(t("Failed to upload image", "图片上传失败"));
    return null;
  }
};
