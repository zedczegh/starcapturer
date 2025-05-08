
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

/**
 * Checks if the comment_images bucket exists and is accessible
 * Uses a "try-it-and-see" approach rather than attempting bucket creation
 */
export const ensureCommentImagesBucket = async (): Promise<boolean> => {
  try {
    // First check if the bucket exists by listing buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error checking buckets:", bucketsError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'comment_images');
    
    if (!bucketExists) {
      // Create the bucket only if it doesn't exist
      const { error } = await supabase.storage.createBucket('comment_images', {
        public: true
      });
      
      if (error) {
        console.error("Failed to create comment_images bucket:", error);
        return false;
      }
      console.log("Created comment_images bucket successfully");
    }
    
    // Double-check we can access the bucket now
    const { data, error } = await supabase.storage
      .from('comment_images')
      .list('');
      
    if (error) {
      console.error("Error accessing comment_images bucket:", error);
      return false;
    }
    
    console.log("comment_images bucket is available");
    return true;
  } catch (error) {
    console.error("Exception checking/creating comment_images bucket:", error);
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
  try {
    if (!imageFile) return null;
    
    // Check if bucket is accessible and create if needed
    const bucketReady = await ensureCommentImagesBucket();
    if (!bucketReady) {
      console.error("Comment images bucket is not accessible");
      toast.error(t("Failed to access storage", "无法访问存储"));
      return null;
    }
    
    // Generate a unique filename
    const uniqueId = uuidv4();
    const fileExt = imageFile.name.split('.').pop() || '';
    const sanitizedExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Store filename as a path (without dot notation which causes issues)
    const fileName = `${uniqueId}-${sanitizedExt}`; 
    
    console.log("Uploading comment image with filename:", fileName);
    
    // Upload the image to the existing bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('comment_images')
      .upload(fileName, imageFile, {
        contentType: imageFile.type,
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      toast.error(t("Failed to upload image", "图片上传失败"));
      return null;
    }
    
    // Get the public URL
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
    console.error("Exception during image upload:", err);
    return null;
  }
};
