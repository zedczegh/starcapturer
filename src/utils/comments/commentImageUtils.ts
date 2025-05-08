
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads an image to the comment_images bucket and returns the public URL
 */
export const uploadCommentImage = async (
  imageFile: File, 
  t: (key: string, fallback: string) => string
): Promise<string | null> => {
  try {
    if (!imageFile) return null;
    
    // Generate a unique filename
    const uniqueId = uuidv4();
    const fileExt = imageFile.name.split('.').pop() || '';
    const sanitizedExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `${uniqueId}.${sanitizedExt || 'jpg'}`;
    
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
