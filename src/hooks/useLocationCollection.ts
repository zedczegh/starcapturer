
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export const useLocationCollection = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);

  const saveLocation = useCallback(async (location: any) => {
    if (!user) {
      toast.error(t("Authentication Required", "需要登录"), {
        description: t("Please sign in to save locations", "请登录以保存位置"),
      });
      return false;
    }

    setIsSaving(true);
    try {
      // Check if location already exists
      const { data: existingLocation } = await supabase
        .from('saved_locations')
        .select('id')
        .eq('user_id', user.id)
        .eq('latitude', location.latitude)
        .eq('longitude', location.longitude)
        .maybeSingle();

      if (existingLocation) {
        toast.info(t("Already in Collection", "已在收藏中"), {
          description: t("This location is already in your collection", "此位置已在您的收藏中")
        });
        setIsSaving(false);
        return false;
      }

      const { error, data } = await supabase.from('saved_locations').insert({
        user_id: user.id,
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        bortleScale: location.bortleScale,
        certification: location.certification,
        isDarkSkyReserve: location.isDarkSkyReserve,
        siqs: location.siqs
      }).select().maybeSingle();

      if (error) throw error;

      toast.success(t("Location Saved", "位置已保存"), {
        description: t("Location has been added to your collection", "位置已添加到您的收藏")
      });
      
      return data;
    } catch (error: any) {
      toast.error(t("Error", "错误"), {
        description: error.message
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, t]);
  
  const removeLocation = useCallback(async (locationId: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('id', locationId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success(t("Location Removed", "位置已删除"), {
        description: t("Location has been removed from your collection", "位置已从您的收藏中删除")
      });
      
      return true;
    } catch (error: any) {
      toast.error(t("Error", "错误"), {
        description: error.message
      });
      return false;
    }
  }, [user, t]);

  return {
    saveLocation,
    removeLocation,
    isSaving
  };
};
