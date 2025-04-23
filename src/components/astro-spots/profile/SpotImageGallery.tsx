import React, { useState, useEffect } from 'react';
import { Album, ImagePlus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ImageUploadDialog from '../ImageUploadDialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [localImages, setLocalImages] = useState<string[]>(spotImages);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  
  useEffect(() => {
    setLocalImages(spotImages);
  }, [spotImages]);

  const handleUploadImages = async (files: File[]) => {
    if (!spotId || !files.length) return;
    
    try {
      const uploadResults = [];
      
      for (const file of files) {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        
        const { error, data } = await supabase.storage
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
          
          const { data: publicUrlData } = supabase.storage
            .from('astro_spot_images')
            .getPublicUrl(`${spotId}/${fileName}`);
          
          if (publicUrlData) {
            setLocalImages(prev => [...prev, publicUrlData.publicUrl]);
          }
        }
      }
      
      const failures = uploadResults.filter(r => !r.success);
      
      if (failures.length > 0) {
        console.error("Failed uploads:", failures);
        toast.error(t("Failed to upload some images", "部分图片上传失败"));
      } else {
        onImagesUpdate();
      }
    } catch (error) {
      console.error("Error in upload process:", error);
      toast.error(t("Failed to upload images", "图片上传失败"));
    }
  };

  if (loadingImages) {
    return (
      <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
        <h2 className="text-xl font-semibold text-gray-200 mb-3 flex items-center">
          <Album className="h-5 w-5 mr-2 text-primary/80" />
          {t("Location Images", "位置图片")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="aspect-square bg-cosmic-800/50 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-gray-200 flex items-center">
          <Album className="h-5 w-5 mr-2 text-primary/80" />
          {t("Location Images", "位置图片")} 
          <span className="ml-2 text-sm text-cosmic-400">
            ({localImages.length}/10)
          </span>
        </h2>
        
        {user && localImages.length < 10 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowUploadDialog(true)}
            className="text-primary hover:text-primary/90 hover:bg-cosmic-800/50"
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            {t("Upload", "上传")}
          </Button>
        )}
      </div>
      
      <AnimatePresence>
        {localImages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center text-center py-8"
          >
            <Album className="h-12 w-12 text-gray-500 mb-3" />
            <p className="text-gray-400">{t("No images available", "暂无图片")}</p>
            
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadDialog(true)}
                className="mt-4"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                {t("Add Images", "添加图片")}
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {localImages.map((imageUrl, index) => (
              <motion.div
                key={imageUrl}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-lg border border-cosmic-600/30 shadow-md",
                  "cursor-pointer transition-transform hover:scale-[1.02] group"
                )}
                onClick={() => {
                  setSelectedImageIndex(index);
                  setShowPhotosDialog(true);
                }}
              >
                <img 
                  src={imageUrl} 
                  alt={`${spotName} - ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Image failed to load:", imageUrl);
                    e.currentTarget.src = 'https://placehold.co/400x400/121927/8888aa?text=Image+Not+Found';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <ImageUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onUpload={handleUploadImages}
        maxImages={10}
        currentCount={localImages.length}
      />

      <Dialog open={showPhotosDialog} onOpenChange={setShowPhotosDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Photo Album", "照片集")}: {spotName}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            {selectedImageIndex !== null && (
              <>
                <img
                  src={localImages[selectedImageIndex]}
                  alt={`${spotName} - Full view`}
                  className="w-full rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/800x600/121927/8888aa?text=Image+Not+Found';
                  }}
                />
                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedImageIndex(
                      prev => prev !== null ? 
                        (prev - 1 + localImages.length) % localImages.length : null
                    )}
                    disabled={localImages.length <= 1}
                  >
                    {t("Previous", "上一张")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedImageIndex(
                      prev => prev !== null ? 
                        (prev + 1) % localImages.length : null
                    )}
                    disabled={localImages.length <= 1}
                  >
                    {t("Next", "下一张")}
                  </Button>
                </div>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-4">
            {localImages.map((imageUrl, index) => (
              <div
                key={`thumbnail-${index}`}
                className={cn(
                  "relative aspect-square cursor-pointer overflow-hidden rounded-md border-2",
                  selectedImageIndex === index
                    ? "border-primary"
                    : "border-transparent hover:border-primary/50"
                )}
                onClick={() => setSelectedImageIndex(index)}
              >
                <img
                  src={imageUrl}
                  alt={`${spotName} - ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/100x100/121927/8888aa?text=Error';
                  }}
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpotImageGallery;
