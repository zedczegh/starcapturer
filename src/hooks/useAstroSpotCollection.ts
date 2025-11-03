import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface AstroSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  bortlescale?: number;
  siqs?: number;
  verification_status?: string;
  spot_type?: string;
}

export const useAstroSpotCollection = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);

  const saveAstroSpot = useCallback(async (astroSpot: AstroSpot) => {
    if (!user) {
      toast.error(t("Authentication Required", "需要登录"), {
        description: t("Please sign in to save astro spots", "请登录以保存观星点"),
      });
      return false;
    }

    setIsSaving(true);
    try {
      // Check if astro spot already exists in saved spots
      const { data: existingSpot } = await supabase
        .from('saved_astro_spots')
        .select('id')
        .eq('user_id', user.id)
        .eq('spot_id', astroSpot.id)
        .maybeSingle();

      if (existingSpot) {
        toast.info(t("Already in Collection", "已在收藏中"), {
          description: t("This astro spot is already in your collection", "此观星点已在您的收藏中")
        });
        setIsSaving(false);
        return false;
      }

      const { error, data } = await supabase.from('saved_astro_spots').insert({
        user_id: user.id,
        spot_id: astroSpot.id,
        name: astroSpot.name,
        latitude: astroSpot.latitude,
        longitude: astroSpot.longitude,
        bortlescale: astroSpot.bortlescale,
        siqs: astroSpot.siqs,
        verification_status: astroSpot.verification_status
      }).select().maybeSingle();

      if (error) throw error;

      toast.success(t("AstroSpot Saved", "观星点已保存"), {
        description: t("AstroSpot has been added to your collection", "观星点已添加到您的收藏")
      });
      
      return data;
    } catch (error: any) {
      console.error('Error saving astro spot:', error);
      toast.error(t("Error", "错误"), {
        description: error.message
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, t]);
  
  const removeAstroSpot = useCallback(async (spotId: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('saved_astro_spots')
        .delete()
        .eq('spot_id', spotId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success(t("AstroSpot Removed", "观星点已删除"), {
        description: t("AstroSpot has been removed from your collection", "观星点已从您的收藏中删除")
      });
      
      return true;
    } catch (error: any) {
      console.error('Error removing astro spot:', error);
      toast.error(t("Error", "错误"), {
        description: error.message
      });
      return false;
    }
  }, [user, t]);

  const checkIfSaved = useCallback(async (spotId: string) => {
    if (!user) return false;
    
    try {
      const { data } = await supabase
        .from('saved_astro_spots')
        .select('id')
        .eq('user_id', user.id)
        .eq('spot_id', spotId)
        .maybeSingle();

      return !!data;
    } catch (error) {
      console.error('Error checking if astro spot is saved:', error);
      return false;
    }
  }, [user]);

  return {
    saveAstroSpot,
    removeAstroSpot,
    checkIfSaved,
    isSaving
  };
};