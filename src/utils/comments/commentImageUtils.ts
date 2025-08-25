import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Upload a single image to the comment_images bucket
 * Uses timestamp-based naming to avoid UUID parsing issues
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

    // Validate file size (60MB limit)
    const maxSize = 60 * 1024 * 1024; // 60MB
    if (imageFile.size > maxSize) {
      console.error("File too large:", imageFile.size);
      toast.error(t("Image must be less than 60MB", "图片必须小于60MB"));
      return null;
    }

    // Use timestamp + random string to avoid UUID parsing issues
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExtension = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `img_${timestamp}_${randomStr}.${fileExtension}`;
    
    console.log("Uploading comment image with filename:", fileName);
    console.log("File size:", imageFile.size, "bytes");
    console.log("File type:", imageFile.type);

    // First, let's test bucket access
    try {
      const { data: bucketData, error: bucketError } = await supabase.storage
        .from('comment_images')
        .list('', { limit: 1 });
      
      if (bucketError) {
        console.error("Bucket access error:", bucketError);
        toast.error(t("Storage access denied", "存储访问被拒绝"));
        return null;
      }
      console.log("Bucket access confirmed");
    } catch (bucketErr) {
      console.error("Bucket test failed:", bucketErr);
      toast.error(t("Storage not available", "存储不可用"));
      return null;
    }

    // Upload to Supabase storage with explicit options
    const { data, error: uploadError } = await supabase.storage
      .from('comment_images')
      .upload(fileName, imageFile, {
        contentType: imageFile.type,
        cacheControl: '3600',
        upsert: false,
        duplex: 'half'
      });

    if (uploadError) {
      console.error("Upload error details:", {
        message: uploadError.message,
        error: uploadError,
        fileName,
        fileSize: imageFile.size,
        fileType: imageFile.type
      });
      
      // Check for specific error types
      if (uploadError.message?.includes('uuid')) {
        console.error("UUID parsing error detected");
        toast.error(t("Upload system error. Please try again.", "上传系统错误。请重试。"));
      } else if (uploadError.message?.includes('size')) {
        toast.error(t("File too large", "文件太大"));
      } else if (uploadError.message?.includes('policy')) {
        toast.error(t("Upload not allowed", "不允许上传"));
      } else {
        toast.error(t("Failed to upload image", "图片上传失败"));
      }
      return null;
    }

    if (!data?.path) {
      console.error("No upload path returned from Supabase");
      toast.error(t("Upload failed - no path", "上传失败 - 无路径"));
      return null;
    }

    console.log("Upload successful, path:", data.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('comment_images')
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      console.error("Failed to get public URL for uploaded file");
      toast.error(t("Failed to get image URL", "无法获取图片URL"));
      return null;
    }

    console.log("Image uploaded successfully:", urlData.publicUrl);
    return urlData.publicUrl;

  } catch (error) {
    console.error("Exception during image upload:", error);
    console.error("Error details:", {
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
      fileName: imageFile?.name,
      fileSize: imageFile?.size
    });
    toast.error(t("Upload failed due to system error", "系统错误导致上传失败"));
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
    console.log("No images to upload");
    return [];
  }

  console.log(`Starting batch upload of ${imageFiles.length} images`);

  try {
    // Upload images sequentially to avoid overwhelming the server
    const results: string[] = [];
    
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      console.log(`Uploading image ${i + 1}/${imageFiles.length}: ${file.name}`);
      
      const url = await uploadCommentImage(file, t);
      if (url) {
        results.push(url);
        console.log(`Successfully uploaded ${i + 1}/${imageFiles.length}`);
      } else {
        console.error(`Failed to upload ${i + 1}/${imageFiles.length}: ${file.name}`);
      }
      
      // Add small delay between uploads to prevent rate limiting
      if (i < imageFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`Batch upload complete: ${results.length}/${imageFiles.length} successful`);
    
    if (results.length !== imageFiles.length) {
      const failedCount = imageFiles.length - results.length;
      toast.error(t(`${failedCount} images failed to upload`, `${failedCount} 张图片上传失败`));
    } else if (results.length > 0) {
      toast.success(t(`All ${results.length} images uploaded successfully`, `所有 ${results.length} 张图片上传成功`));
    }
    
    return results;
  } catch (error) {
    console.error("Exception during batch image upload:", error);
    toast.error(t("Batch upload failed", "批量上传失败"));
    return [];
  }
};

// Legacy exports for backward compatibility
export const uploadSingleCommentImage = uploadCommentImage;
export const ensureCommentImagesBucket = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('comment_images')
      .list('', { limit: 1 });
    return !error;
  } catch {
    return false;
  }
};