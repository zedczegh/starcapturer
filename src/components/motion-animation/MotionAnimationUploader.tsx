import { useRef, useState } from "react";
import { Upload, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { validateImageFile, loadImageFromFile } from "@/utils/imageProcessingUtils";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface MotionAnimationUploaderProps {
  onImageUpload: (dataUrl: string, element: HTMLImageElement) => void;
}

export const MotionAnimationUploader = ({ onImageUpload }: MotionAnimationUploaderProps) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (file: File) => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || t("Invalid file", "文件无效"));
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Load image without downscaling (preserve original quality)
      const { dataUrl, element } = await loadImageFromFile(file, {
        enableDownscale: false
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success(t("Image loaded successfully", "图片加载成功"));
      onImageUpload(dataUrl, element);
    } catch (error) {
      console.error("Error loading image:", error);
      toast.error(t("Failed to load image", "加载图片失败"));
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Card 
      className="border-2 border-dashed border-primary/30 bg-cosmic-800/40 backdrop-blur-xl hover:border-primary/60 transition-colors cursor-pointer"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="p-8 sm:p-12 text-center">
        <div className="flex justify-center mb-4">
          {isProcessing ? (
            <FileImage className="w-16 h-16 text-primary animate-pulse" />
          ) : (
            <Upload className="w-16 h-16 text-primary" />
          )}
        </div>
        
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {isProcessing 
            ? t("Processing image...", "处理图片中...")
            : t("Upload Your Photo", "上传您的照片")
          }
        </h3>
        
        <p className="text-sm text-cosmic-300 mb-4">
          {t("Drag and drop or click to browse", "拖放或点击浏览")}
        </p>
        
        {isProcessing && (
          <div className="max-w-xs mx-auto mb-4">
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
        
        <div className="text-xs text-cosmic-400 space-y-1">
          <p>{t("Supported formats: JPG, PNG, TIFF, FITS, BMP, WebP", "支持格式：JPG、PNG、TIFF、FITS、BMP、WebP")}</p>
          <p>{t("Maximum size: 500MB", "最大尺寸：500MB")}</p>
        </div>
        
        <Button 
          variant="default" 
          className="mt-6"
          disabled={isProcessing}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          {t("Select File", "选择文件")}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.tiff,.tif,.fits,.fit"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>
    </Card>
  );
};
