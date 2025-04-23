import React, { useState } from 'react';
import { Album, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SpotImageGalleryProps {
  spotId: string;
  spotName: string;
  spotImages: string[];
  loadingImages: boolean;
  user: boolean;
  onImagesUpdate: () => void;
}

const SpotImageGallery: React.FC<SpotImageGalleryProps> = ({
  spotId,
  spotName,
  spotImages,
  loadingImages,
  user,
  onImagesUpdate
}) => {
  const { t } = useLanguage();
  const [showPhotosDialog, setShowPhotosDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  const createBucketIfNeeded = async () => {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'astro_spot_images');
      
      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket('astro_spot_images', {
          public: true
        });
        
        if (error) {
          console.error("Error creating bucket:", error);
          return false;
        }
        console.log("Created astro_spot_images bucket");
      }
      return true;
    } catch (error) {
      console.error("Error checking/creating bucket:", error);
      return false;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    if (spotImages.length + e.target.files.length > 10) {
      toast.error(t("Maximum 10 images allowed", "最多允许10张图片"));
      return;
    }
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleUploadImages = async () => {
    if (!spotId || !selectedFiles.length) return;
    
    setImageUploading(true);
    
    try {
      const bucketReady = await createBucketIfNeeded();
      if (!bucketReady) {
        toast.error(t("Failed to prepare storage", "存储准备失败"));
        return;
      }
      
      const uploadResults = [];
      
      for (const file of selectedFiles) {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        
        const { error } = await supabase.storage
          .from('astro_spot_images')
          .upload(`${spotId}/${fileName}`, file, { 
            upsert: false,
            cacheControl: '3600'
          });
          
        if (error) {
          console.error(`Error uploading ${fileName}:`, error);
          uploadResults.push({ success: false, fileName, error });
        } else {
          uploadResults.push({ success: true, fileName });
        }
      }
      
      const failures = uploadResults.filter(r => !r.success);
      
      if (failures.length > 0) {
        console.error("Failed uploads:", failures);
        toast.error(t("Failed to upload some images", "部分图片上传失败"));
      } else {
        toast.success(t("Images uploaded!", "图片已上传！"));
        setSelectedFiles([]);
        onImagesUpdate();
      }
    } catch (error) {
      console.error("Error in upload process:", error);
      toast.error(t("Failed to upload images", "图片上传失败"));
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
      <h2 className="text-xl font-semibold text-gray-200 mb-3 flex items-center">
        <Album className="h-5 w-5 mr-2 text-primary/80" />
        {t("Location Images", "位置图片")}
      </h2>
      
      {loadingImages ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="aspect-square bg-cosmic-800/50 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : spotImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {spotImages.map((imageUrl, index) => (
            <div 
              key={`image-${index}`}
              className="relative aspect-square overflow-hidden rounded-lg border border-cosmic-600/30 shadow-md"
              onClick={() => setShowPhotosDialog(true)}
            >
              <img 
                src={imageUrl} 
                alt={`${spotName} - ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                onError={(e) => {
                  console.error("Image failed to load:", imageUrl);
                  e.currentTarget.src = 'https://placehold.co/400x400/121927/8888aa?text=Image+Not+Found';
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-8">
          <Album className="h-12 w-12 text-gray-500 mb-3" />
          <p className="text-gray-400">{t("No images available", "暂无图片")}</p>
        </div>
      )}
      
      {user && (
        <div className="mt-4">
          <div className="bg-cosmic-800/40 rounded-lg p-4 border border-cosmic-700/30">
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              {t("Upload Images", "上传图片")}
            </h3>
            <div className="space-y-3">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="bg-cosmic-900/40 border-cosmic-700/30 text-gray-300"
              />
              {selectedFiles.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    {t("Selected", "已选择")}: {selectedFiles.length} {selectedFiles.length > 1 ? t("files", "个文件") : t("file", "个文件")}
                  </span>
                  <Button
                    onClick={handleUploadImages}
                    disabled={imageUploading}
                    size="sm"
                  >
                    {imageUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("Uploading...", "上传中...")}
                      </>
                    ) : (
                      t("Upload", "上传")
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={showPhotosDialog} onOpenChange={setShowPhotosDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Photo Album", "照片集")}: {spotName}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {spotImages.map((imageUrl, index) => (
              <div key={`dialog-image-${index}`} className="relative overflow-hidden rounded-lg border border-cosmic-600/30">
                <img 
                  src={imageUrl} 
                  alt={`${spotName} - ${index + 1}`}
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    console.error("Dialog image failed to load:", imageUrl);
                    e.currentTarget.src = 'https://placehold.co/600x400/121927/8888aa?text=Image+Not+Found';
                  }}
                />
              </div>
            ))}
          </div>
          {spotImages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <Album className="h-16 w-16 text-gray-500 mb-4" />
              <p className="text-gray-400 text-lg">
                {t("No images available", "暂无图片")}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpotImageGallery;
