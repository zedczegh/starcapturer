import { useState, useCallback } from 'react';
import { uploadCommentImages } from '@/utils/comments/commentImageUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export const useCommentImageUpload = () => {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);

  const uploadImages = useCallback(async (files: File[]): Promise<string[]> => {
    if (!files?.length) {
      return [];
    }

    setUploading(true);
    
    try {
      console.log(`Starting upload of ${files.length} images`);
      const uploadedUrls = await uploadCommentImages(files, t);
      
      if (uploadedUrls.length > 0) {
        toast.success(t(`${uploadedUrls.length} images uploaded successfully`, `${uploadedUrls.length} 张图片上传成功`));
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(t('Upload failed', '上传失败'));
      return [];
    } finally {
      setUploading(false);
    }
  }, [t]);

  return {
    uploadImages,
    uploading
  };
};