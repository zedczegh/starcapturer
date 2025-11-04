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
  console.log("=== UPLOAD DEBUG START ===");
  console.log("File details:", {
    name: imageFile.name,
    size: imageFile.size,
    type: imageFile.type
  });

  try {
    if (!imageFile) {
      console.error("DEBUG: No image file provided");
      return null;
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      console.error("DEBUG: Invalid file type:", imageFile.type);
      toast.error(t("Please select a valid image file", "请选择有效的图片文件"));
      return null;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (imageFile.size > maxSize) {
      console.error("DEBUG: File too large:", imageFile.size);
      toast.error(t("Image must be less than 50MB", "图片必须小于50MB"));
      return null;
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("DEBUG: Auth check:", { user: user?.id, authError });
    
    if (authError || !user) {
      console.error("DEBUG: Authentication failed:", authError);
      toast.error(t("Authentication required", "需要身份验证"));
      return null;
    }

    // Test bucket access with detailed logging
    console.log("DEBUG: Testing bucket access...");
    const { data: bucketData, error: bucketError } = await supabase.storage
      .from('comment_images')
      .list('', { limit: 1 });
    
    console.log("DEBUG: Bucket test result:", { bucketData, bucketError });
    
    if (bucketError) {
      console.error("DEBUG: Bucket access error:", bucketError);
      toast.error(t("Storage access denied", "存储访问被拒绝"));
      return null;
    }

    // Use simple filename without any folder structure
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExtension = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `comment_${timestamp}_${randomStr}.${fileExtension}`;
    
    console.log("DEBUG: Generated filename:", fileName);

    // Prepare upload with minimal options
    const uploadOptions = {
      contentType: imageFile.type,
      cacheControl: '3600',
      upsert: false
    };
    
    console.log("DEBUG: Upload options:", uploadOptions);
    console.log("DEBUG: Starting upload...");

    // Upload to Supabase storage
    const { data, error: uploadError } = await supabase.storage
      .from('comment_images')
      .upload(fileName, imageFile, uploadOptions);

    console.log("DEBUG: Upload result:", { data, uploadError });

    if (uploadError) {
      console.error("DEBUG: Upload error full details:", {
        message: uploadError.message,
        error: uploadError,
        fileName,
        fileSize: imageFile.size,
        fileType: imageFile.type,
        userId: user.id
      });
      
      toast.error(t("Upload failed: " + uploadError.message, "上传失败: " + uploadError.message));
      return null;
    }

    if (!data?.path) {
      console.error("DEBUG: No upload path returned from Supabase");
      toast.error(t("Upload failed - no path", "上传失败 - 无路径"));
      return null;
    }

    console.log("DEBUG: Upload successful, path:", data.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('comment_images')
      .getPublicUrl(data.path);

    console.log("DEBUG: Public URL result:", urlData);

    if (!urlData?.publicUrl) {
      console.error("DEBUG: Failed to get public URL for uploaded file");
      toast.error(t("Failed to get image URL", "无法获取图片URL"));
      return null;
    }

    console.log("DEBUG: SUCCESS - Image uploaded:", urlData.publicUrl);
    console.log("=== UPLOAD DEBUG END ===");
    return urlData.publicUrl;

  } catch (error) {
    console.error("DEBUG: Exception during image upload:", error);
    console.error("DEBUG: Error stack:", (error as Error)?.stack);
    console.log("=== UPLOAD DEBUG END (ERROR) ===");
    toast.error(t("Upload system error", "上传系统错误"));
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
    console.log("=== UPLOAD DEBUG: No images to upload ===");
    return [];
  }

  console.log("=== IMAGE UPLOAD PROCESS START ===");
  console.log(`Starting batch upload of ${imageFiles.length} images`);

  try {
    // Upload images sequentially to avoid overwhelming the server
    const results: string[] = [];
    
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      console.log(`--- Uploading image ${i + 1}/${imageFiles.length}: ${file.name} ---`);
      
      const url = await uploadCommentImage(file, t);
      console.log(`Upload result for ${file.name}:`, url);
      
      if (url) {
        results.push(url);
        console.log(`✓ Successfully uploaded ${i + 1}/${imageFiles.length}: ${url}`);
      } else {
        console.error(`✗ Failed to upload ${i + 1}/${imageFiles.length}: ${file.name}`);
      }
      
      // Add small delay between uploads to prevent rate limiting
      if (i < imageFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`--- BATCH UPLOAD COMPLETE ---`);
    console.log(`Success: ${results.length}/${imageFiles.length} images uploaded`);
    console.log(`Final URLs array:`, results);
    console.log(`URLs array length:`, results.length);
    console.log(`URLs JSON:`, JSON.stringify(results));
    
    if (results.length !== imageFiles.length) {
      const failedCount = imageFiles.length - results.length;
      toast.error(t(`${failedCount} images failed to upload`, `${failedCount} 张图片上传失败`));
    } else if (results.length > 0) {
      toast.success(t(`All ${results.length} images uploaded successfully`, `所有 ${results.length} 张图片上传成功`));
    }
    
    console.log("=== IMAGE UPLOAD PROCESS END ===");
    return results;
  } catch (error) {
    console.error("=== UPLOAD PROCESS EXCEPTION ===");
    console.error("Exception during batch image upload:", error);
    console.error("Exception details:", error instanceof Error ? error.message : String(error));
    console.error("Exception stack:", error instanceof Error ? error.stack : 'No stack');
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