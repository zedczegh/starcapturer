
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export const useLocationCollection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);

  const saveLocation = useCallback(async (location: any) => {
    if (!user) {
      toast({
        title: t("Authentication Required", "需要登录"),
        description: t("Please sign in to save locations", "请登录以保存位置"),
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('saved_locations').insert({
        user_id: user.id,
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        bortleScale: location.bortleScale,
        certification: location.certification,
        isDarkSkyReserve: location.isDarkSkyReserve,
        siqs: location.siqs
      });

      if (error) throw error;

      toast({
        title: t("Location Saved", "位置已保存"),
        description: t("Location has been added to your collection", "位置已添加到您的收藏"),
      });
    } catch (error: any) {
      toast({
        title: t("Error", "错误"),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, toast, t]);

  return {
    saveLocation,
    isSaving
  };
};
