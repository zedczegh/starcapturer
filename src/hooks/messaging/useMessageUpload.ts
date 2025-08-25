
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export const useMessageUpload = () => {
  const { t } = useLanguage();
  
  // Check if message_images bucket is accessible
  const ensureMessageImagesBucket = async (): Promise<boolean> => {
    try {
      console.log("Checking if message_images bucket exists...");
      
      // Check bucket existence by attempting a list operation
      const { error } = await supabase.storage
        .from('message_images')
        .list('');
        
      if (error) {
        console.error("Error checking message_images bucket:", error);
        return false;
      }
      
      // If we got here, the bucket exists and we have permissions
      console.log("message_images bucket is available");
      return true;
    } catch (error) {
      console.error("Exception checking message_images bucket:", error);
      return false;
    }
  };

  // Upload image for message
  const uploadMessageImage = async (imageFile: File): Promise<string | null> => {
    if (!imageFile) return null;
    
    // Check if bucket is accessible
    const bucketReady = await ensureMessageImagesBucket();
    if (!bucketReady) {
      console.error("Message images bucket is not accessible");
      toast.error(t("Failed to access storage", "无法访问存储"));
      return null;
    }
    
    try {
      // Generate a unique filename
      const uniqueId = uuidv4();
      const fileExt = imageFile.name.split('.').pop() || 'jpg';
      const sanitizedExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const fileName = `${uniqueId}.${sanitizedExt}`;
      
      console.log("Uploading message image with filename:", fileName);
      
      // Upload the image to the bucket
      const { error: uploadError } = await supabase.storage
        .from('message_images')
        .upload(fileName, imageFile, {
          contentType: imageFile.type,
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) {
        console.error("Error uploading message image:", uploadError);
        return null;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('message_images')
        .getPublicUrl(fileName);
      
      if (!publicUrlData?.publicUrl) {
        console.error("Failed to get public URL for message image");
        return null;
      }
      
      console.log("Message image uploaded successfully, public URL:", publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("Exception during message image upload:", err);
      return null;
    }
  };
  
  return {
    uploadMessageImage
  };
};
