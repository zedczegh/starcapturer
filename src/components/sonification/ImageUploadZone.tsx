
import React, { forwardRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImageUploadZoneProps {
  onImageUpload: (file: File) => void;
  imagePreview: string | null;
  isProcessing: boolean;
}

const ImageUploadZone = forwardRef<HTMLInputElement, ImageUploadZoneProps>(
  ({ onImageUpload, imagePreview, isProcessing }, ref) => {
    const { t } = useLanguage();

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onImageUpload(files[0]);
      }
    }, [onImageUpload]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
    }, []);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onImageUpload(files[0]);
      }
    }, [onImageUpload]);

    return (
      <div className="space-y-4">
        {!imagePreview ? (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="border-2 border-dashed border-cosmic-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => (ref as React.RefObject<HTMLInputElement>)?.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-cosmic-400" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {t('Upload Astronomy Image', '上传天文图片')}
            </h3>
            <p className="text-cosmic-400 mb-4">
              {t('Drag and drop or click to select', '拖拽或点击选择文件')}
            </p>
            <p className="text-xs text-cosmic-500">
              {t('Supports JPG, PNG, FITS (max 10MB)', '支持 JPG、PNG、FITS 格式（最大10MB）')}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-lg overflow-hidden"
          >
            <img
              src={imagePreview}
              alt="Astronomy preview"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="bg-black/50 rounded-lg p-3 flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-white" />
                <span className="text-white text-sm font-medium">
                  {t('Image Ready', '图片就绪')}
                </span>
              </div>
            </div>
          </motion.div>
        )}
        
        <input
          ref={ref}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />
      </div>
    );
  }
);

ImageUploadZone.displayName = 'ImageUploadZone';

export default ImageUploadZone;
