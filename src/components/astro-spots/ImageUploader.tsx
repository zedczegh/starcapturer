
import React from 'react';
import { Image, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploaderProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  uploading?: boolean;
  onUpload?: () => Promise<void>;
  spotId?: string;
  existingImages?: string[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onImagesChange,
  uploading = false,
  onUpload,
  spotId,
  existingImages = []
}) => {
  const { t } = useLanguage();
  const totalImagesCount = images.length + (existingImages?.length || 0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      if (totalImagesCount + newImages.length > 10) {
        toast.error(t("Maximum 10 images allowed", "最多允许10张图片"));
        return;
      }
      onImagesChange([...images, ...newImages]);
    }
  };

  const createBucketIfNeeded = async () => {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'astro_spot_images');
      
      if (!bucketExists) {
        await supabase.storage.createBucket('astro_spot_images', {
          public: true
        });
        console.log("Created astro_spot_images bucket");
      }
      return true;
    } catch (error) {
      console.error("Error checking/creating bucket:", error);
      return false;
    }
  };

  // Default upload handler if none provided
  const handleUpload = async () => {
    if (!spotId || !images.length) return;
    
    // Ensure bucket exists
    const bucketReady = await createBucketIfNeeded();
    if (!bucketReady) {
      toast.error(t("Failed to prepare storage", "存储准备失败"));
      return;
    }
    
    for (const file of images) {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      
      const { error } = await supabase.storage
        .from('astro_spot_images')
        .upload(`${spotId}/${fileName}`, file, { 
          upsert: false,
          cacheControl: '3600'
        });
        
      if (error) {
        console.error(`Error uploading ${fileName}:`, error);
        toast.error(t("Failed to upload image", "图片上传失败"));
        return;
      }
    }
    
    toast.success(t("Images uploaded!", "图片已上传！"));
    onImagesChange([]);
  };

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">
        {t("Location Images", "位置图片")}
        <span className="text-xs text-muted-foreground ml-2">
          ({t("Maximum 10 images", "最多10张图片")})
        </span>
      </label>
      <div className="grid gap-4">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Image className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("Click to upload images", "点击上传图片")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalImagesCount}/10 {t("images", "张图片")}
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading || totalImagesCount >= 10}
          />
        </label>
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => onImagesChange(images.filter((_, i) => i !== index))}
                  className="absolute top-1 right-1 bg-destructive/90 text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={t("Remove image", "删除图片")}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {images.length > 0 && (
          <div className="flex justify-end">
            <button 
              onClick={onUpload || handleUpload}
              disabled={uploading}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md disabled:opacity-50"
            >
              {uploading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  {t("Uploading...", "上传中...")}
                </div>
              ) : (
                t("Upload", "上传")
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
