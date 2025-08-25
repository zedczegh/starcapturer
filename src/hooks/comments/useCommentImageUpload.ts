import { useState, useCallback } from 'react';
import { uploadCommentImages } from '@/utils/comments/commentImageUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export const useCommentImageUpload = () => {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImages = useCallback(async (files: File[]): Promise<string[]> => {
    if (!files?.length) {
      console.log("No files provided for upload");
      return [];
    }

    console.log(`useCommentImageUpload: Starting upload of ${files.length} files`);
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Show initial progress
      setUploadProgress(10);
      
      const uploadedUrls = await uploadCommentImages(files, t);
      
      setUploadProgress(100);
      
      console.log(`useCommentImageUpload: Upload complete - ${uploadedUrls.length}/${files.length} successful`);
      
      return uploadedUrls;
    } catch (error) {
      console.error('useCommentImageUpload: Upload failed with exception:', error);
      toast.error(t('Upload system error', '上传系统错误'));
      return [];
    } finally {
      // Reset state after a brief delay to show completion
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  }, [t]);

  return {
    uploadImages,
    uploading,
    uploadProgress
  };
};