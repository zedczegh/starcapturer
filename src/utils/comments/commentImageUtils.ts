import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a single image to the comment_images bucket
 */
export const uploadCommentImage = async (
  imageFile: File, 
  t: (key: string, fallback: string) => string
): Promise<string | null> => {
  try {
    if (!imageFile) {
      console.error("No image file provided");
      return null;
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      console.error("Invalid file type:", imageFile.type);
      toast.error(t("Please select a valid image file", "请选择有效的图片文件"));
      return null;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      console.error("File too large:", imageFile.size);
      toast.error(t("Image must be less than 5MB", "图片必须小于5MB"));
      return null;
    }

    // Generate simple, clean filename
    const fileExtension = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    console.log("Uploading comment image:", fileName);

    // Upload to Supabase storage
    const { data, error: uploadError } = await supabase.storage
      .from('comment_images')
      .upload(fileName, imageFile, {
        contentType: imageFile.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      toast.error(t("Failed to upload image", "图片上传失败"));
      return null;
    }

    if (!data?.path) {
      console.error("No upload path returned");
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('comment_images')
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      console.error("Failed to get public URL");
      return null;
    }

    console.log("Image uploaded successfully:", urlData.publicUrl);
    return urlData.publicUrl;

  } catch (error) {
    console.error("Exception during image upload:", error);
    toast.error(t("Upload failed", "上传失败"));
    return null;
  }
};

/**
 * Upload multiple images to the comment_images bucket
 */
export const uploadCommentImages = async (
  imageFiles: File[], 
  t: (key: string, fallback: string) => string
): Promise<string[]> => {
  if (!imageFiles?.length) {
    return [];
  }

  try {
    const uploadPromises = imageFiles.map(file => uploadCommentImage(file, t));
    const results = await Promise.all(uploadPromises);
    
    // Filter out failed uploads
    const successfulUploads = results.filter(url => url !== null) as string[];
    
    if (successfulUploads.length !== imageFiles.length) {
      const failedCount = imageFiles.length - successfulUploads.length;
      toast.error(t(`${failedCount} images failed to upload`, `${failedCount} 张图片上传失败`));
    }
    
    return successfulUploads;
  } catch (error) {
    console.error("Exception during multiple image upload:", error);
    toast.error(t("Upload failed", "上传失败"));
    return [];
  }
};

// Legacy exports for backward compatibility
export const uploadSingleCommentImage = uploadCommentImage;
export const ensureCommentImagesBucket = async (): Promise<boolean> => {
  // Always return true since we're handling this at the storage policy level
  return true;
};