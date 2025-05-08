
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

/**
 * Checks if a bucket exists and creates it if it doesn't
 */
export const ensureCommentImagesBucket = async (): Promise<boolean> => {
  try {
    console.log("Checking if comment_images bucket exists...");
    
    // First, check if the bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'comment_images');
    
    if (!bucketExists) {
      console.log("Creating comment_images bucket...");
      const { error: createError } = await supabase.storage
        .createBucket('comment_images', {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
      
      if (createError) {
        console.error("Error creating comment_images bucket:", createError);
        return false;
      }
      
      console.log("comment_images bucket created successfully");
    } else {
      console.log("comment_images bucket already exists");
    }
    
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
    
    // Ensure bucket exists
    const bucketReady = await ensureCommentImagesBucket();
    if (!bucketReady) {
      console.error("Failed to ensure comment_images bucket exists");
      toast.error(t("Failed to access storage", "无法访问存储"));
      return null;
    }
    
    // Generate a unique filename
    const fileExt = imageFile.name.split('.').pop() || '';
    const sanitizedExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    const uniqueId = uuidv4();
    const fileName = `${uniqueId}.${sanitizedExt}`;
    
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
    return null;
  }
};
