
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export const useAvatarUpload = () => {
  const { user, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    
    try {
      setUploadingAvatar(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      setAvatarUrl(publicUrl);
      await refreshProfile();
      
      toast.success(t("Avatar updated successfully", "头像更新成功"));
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(t("Avatar upload failed", "头像上传失败"));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("Image too large (max 5MB)", "图片太大（最大5MB）"));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error(t("File must be an image", "文件必须是图像"));
        return;
      }
      
      try {
        const previewUrl = URL.createObjectURL(file);
        setAvatarUrl(previewUrl);
        await uploadAvatar(file);
      } catch (err) {
        console.error("Error handling avatar change:", err);
        toast.error(t("Failed to process image", "处理图像失败"));
      }
    }
  }, [t]);

  const removeAvatar = useCallback(async () => {
    if (!user || !avatarUrl) return;
    
    try {
      const storageMatch = avatarUrl.match(/\/avatars\/([^?]+)/);
      if (storageMatch && storageMatch[1]) {
        const fileName = decodeURIComponent(storageMatch[1]);
        await supabase.storage.from('avatars').remove([fileName]);
      }
      
      await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      setAvatarUrl(null);
      await refreshProfile();
      
      toast.success(t("Avatar removed successfully", "头像已成功删除"));
    } catch (error: any) {
      console.error("Remove avatar error:", error);
      toast.error(t("Failed to remove avatar", "删除头像失败"));
    }
  }, [user, avatarUrl, t, refreshProfile]);

  return {
    avatarUrl,
    uploadingAvatar,
    handleAvatarChange,
    removeAvatar
  };
};
