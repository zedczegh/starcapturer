
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates the comment_images bucket if it doesn't exist
 */
export const ensureCommentImagesBucket = async (): Promise<boolean> => {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'comment_images');
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket('comment_images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB limit
      });
      
      if (error) {
        console.error("Error creating comment_images bucket:", error);
        return false;
      }
      console.log("Created comment_images bucket");
    }
    return true;
  } catch (error) {
    console.error("Error checking/creating comment_images bucket:", error);
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
    
    // Ensure the bucket exists
    const bucketReady = await ensureCommentImagesBucket();
    if (!bucketReady) {
      toast.error(t("Failed to prepare storage", "存储准备失败"));
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
