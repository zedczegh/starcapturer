
import React, { useState } from 'react';
import { Upload, Image, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => Promise<void>;
  maxImages: number;
  currentCount: number;
}

const ImageUploadDialog: React.FC<ImageUploadDialogProps> = ({
  open,
  onOpenChange,
  onUpload,
  maxImages,
  currentCount
}) => {
  const { t } = useLanguage();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const remainingSlots = maxImages - currentCount;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > remainingSlots) {
      toast.error(t(
        `You can only upload ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'}`,
        `您最多只能再上传${remainingSlots}张图片`
      ));
      return;
    }
    
    setSelectedFiles(newFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    try {
      await onUpload(selectedFiles);
      setSelectedFiles([]);
      onOpenChange(false);
      toast.success(t("Images uploaded successfully!", "图片上传成功！"));
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t("Failed to upload images", "图片上传失败"));
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("Upload Images", "上传图片")}</DialogTitle>
          <DialogDescription>
            {t(
              `You can upload up to ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'}`,
              `您最多可以再上传${remainingSlots}张图片`
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center w-full">
            <label className="w-full cursor-pointer">
              <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg 
                hover:bg-accent/50 transition-colors border-cosmic-700/50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t("Click to select images", "点击选择图片")}
                  </p>
                </div>
              </div>
              <input
                type="file"
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-cosmic-700/30"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 
                      opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={t("Remove image", "删除图片")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              {t("Cancel", "取消")}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  {t("Uploading...", "上传中...")}
                </>
              ) : (
                t("Upload", "上传")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadDialog;
