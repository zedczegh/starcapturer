
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

/**
 * Checks if a bucket exists and is accessible for the current user
 */
export const ensureCommentImagesBucket = async (): Promise<boolean> => {
  try {
    console.log("Checking if comment_images bucket is accessible...");
    
    // First check if the bucket exists
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
    
    // Try to list files in the bucket to verify access permissions
    const { error } = await supabase.storage
      .from('comment_images')
      .list('', { limit: 1 });
    
    if (error && error.message !== 'The resource was not found') {
      console.error("Error checking comment_images bucket:", error);
      return false;
    }
    
    // If we get here, the bucket is accessible
    console.log("comment_images bucket is accessible");
    return true;
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
  try {
    if (!imageFile) return null;
    
    // Check if bucket is accessible
    const bucketReady = await ensureCommentImagesBucket();
    if (!bucketReady) {
      console.error("Failed to access comment_images bucket");
      toast.error(t("Failed to access storage", "无法访问存储"));
      return null;
    }
    
    // Generate a unique filename with UUID to avoid collisions
    const fileExt = imageFile.name.split('.').pop() || '';
    const sanitizedExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    const timestamp = new Date().getTime();
    const uniqueId = uuidv4();
    const fileName = `${timestamp}-${uniqueId}.${sanitizedExt}`;
    
    console.log(`Uploading image: ${fileName}, size: ${imageFile.size} bytes, type: ${imageFile.type}`);
    
    // Upload the image with explicit content type
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('comment_images')
      .upload(fileName, imageFile, {
        contentType: imageFile.type,
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error("Error uploading comment image:", uploadError);
      toast.error(t("Failed to upload image", "图片上传失败"));
      return null;
    }
    
    console.log("Upload successful, getting public URL");
    
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
    console.error("Exception during comment image upload:", err);
    toast.error(t("Failed to upload image", "图片上传失败"));
    return null;
  }
};
