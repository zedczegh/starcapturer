
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

/**
 * Checks if the comment_images bucket exists and is accessible
 * We don't try to create it as that requires admin privileges
 */
export const ensureCommentImagesBucket = async (): Promise<boolean> => {
  try {
    // Just check if the bucket is accessible by trying to list its contents
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
    console.error("Exception checking comment_images bucket:", error);
    return false;
  }
};

/**
 * Uploads an image to the comment_images bucket and returns the public URL
 * Improved for mobile reliability with optimal file size and better error handling
 */
export const uploadCommentImage = async (
  imageFile: File, 
  t: (key: string, fallback: string) => string
): Promise<string | null> => {
  try {
    if (!imageFile) return null;
    
    // Optimize image size for mobile if file is large (over 1MB)
    let fileToUpload = imageFile;
    if (imageFile.size > 1024 * 1024) {
      try {
        fileToUpload = await optimizeImageForUpload(imageFile);
      } catch (err) {
        console.warn("Image optimization failed, using original:", err);
        // Continue with original file if optimization fails
      }
    }
    
    // Check if bucket is accessible
    const bucketReady = await ensureCommentImagesBucket();
    if (!bucketReady) {
      console.error("Comment images bucket is not accessible");
      toast.error(t("Failed to access storage", "无法访问存储"));
      return null;
    }
    
    // Generate a unique filename with increased randomness
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const fileExt = imageFile.name.split('.').pop() || '';
    const sanitizedExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Use timestamp + UUID as filename to ensure uniqueness
    const fileName = `${timestamp}_${uniqueId}.${sanitizedExt}`; 
    
    console.log("Uploading comment image with filename:", fileName);
    
    // Try uploading with progressive retries
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Upload attempt ${attempts} for ${fileName}`);
      
      // Add a small delay between retries to avoid overwhelming mobile connections
      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('comment_images')
        .upload(fileName, fileToUpload, {
          contentType: fileToUpload.type,
          cacheControl: '3600',
          upsert: attempts > 1 // Only try upsert on retry
        });
        
      if (!uploadError) {
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
      }
      
      console.error(`Error uploading image (attempt ${attempts}):`, uploadError);
      
      // If last attempt failed, break out
      if (attempts >= maxAttempts) {
        toast.error(t("Failed to upload image", "图片上传失败"));
        break;
      }
    }
    
    return null;
  } catch (err) {
    console.error("Exception during image upload:", err);
    return null;
  }
};

/**
 * Helper function to optimize image size for mobile uploads
 * Uses canvas to resize large images to reduce bandwidth usage
 */
async function optimizeImageForUpload(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    // Mobile-optimized image size thresholds
    const MAX_WIDTH = 1200;
    const MAX_HEIGHT = 1200;
    const QUALITY = 0.85;
    
    // Create image element to load the file
    const img = new Image();
    img.onload = () => {
      // Determine if resizing is needed
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions if image is too large
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        if (width > height) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        } else {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      } else {
        // If image is already small enough, use original
        URL.revokeObjectURL(img.src);
        resolve(file);
        return;
      }
      
      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image on canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(img.src);
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob with optimal quality
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            URL.revokeObjectURL(img.src);
            reject(new Error('Could not create blob'));
            return;
          }
          
          // Create new optimized file
          const optimizedFile = new File(
            [blob], 
            file.name, 
            { 
              type: 'image/jpeg',
              lastModified: Date.now() 
            }
          );
          
          URL.revokeObjectURL(img.src);
          console.log(`Image optimized: ${(file.size / 1024).toFixed(1)}KB → ${(optimizedFile.size / 1024).toFixed(1)}KB`);
          resolve(optimizedFile);
        },
        'image/jpeg',
        QUALITY
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image for optimization'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}
