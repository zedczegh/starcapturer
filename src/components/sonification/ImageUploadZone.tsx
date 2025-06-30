
import React, { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadZoneProps {
  onImageUpload: (file: File) => void;
  imagePreview: string | null;
  isProcessing: boolean;
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  onImageUpload,
  imagePreview,
  isProcessing
}) => {
  const { t } = useLanguage();

  const handleFileSelect = useCallback((file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/fits', 'application/fits'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
      toast.error(t('Please upload a valid image file (JPG, PNG, FITS)', '请上传有效的图像文件 (JPG, PNG, FITS)'));
      return;
    }

    if (file.size > maxSize) {
      toast.error(t('File size must be less than 10MB', '文件大小必须小于10MB'));
      return;
    }

    onImageUpload(file);
  }, [onImageUpload, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  return (
    <div className="space-y-4">
      {!imagePreview ? (
        <div
          className="border-2 border-dashed border-cosmic-600 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('image-upload')?.click()}
        >
          <Upload className="h-12 w-12 text-cosmic-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-cosmic-200 mb-2">
            {t('Upload Astronomy Image', '上传天文图像')}
          </p>
          <p className="text-sm text-cosmic-400 mb-4">
            {t('Drag and drop or click to select', '拖放或点击选择')}
          </p>
          <p className="text-xs text-cosmic-500">
            {t('Supports JPG, PNG, FITS formats (max 10MB)', '支持 JPG, PNG, FITS 格式 (最大10MB)')}
          </p>
          <input
            id="image-upload"
            type="file"
            accept="image/*,.fits,.fit"
            onChange={handleFileInput}
            className="hidden"
            disabled={isProcessing}
          />
        </div>
      ) : (
        <div className="relative">
          <img
            src={imagePreview}
            alt="Uploaded astronomy image"
            className="w-full max-h-96 object-contain rounded-lg bg-cosmic-800/20"
          />
          {!isProcessing && (
            <button
              onClick={() => document.getElementById('image-upload')?.click()}
              className="absolute top-2 right-2 bg-cosmic-900/80 hover:bg-cosmic-800/80 p-2 rounded-lg transition-colors"
            >
              <ImageIcon className="h-4 w-4 text-cosmic-200" />
            </button>
          )}
          <input
            id="image-upload"
            type="file"
            accept="image/*,.fits,.fit"
            onChange={handleFileInput}
            className="hidden"
            disabled={isProcessing}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploadZone;
