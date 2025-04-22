
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export const useSpotDataFetcher = (isEditing: boolean, spotId?: string) => {
  const { t } = useLanguage();

  const fetchExistingData = async () => {
    if (isEditing && spotId) {
      try {
        console.log('Fetching existing data for spot:', spotId);
        const { data: typeData, error: typeError } = await supabase
          .from('astro_spot_types')
          .select('*')
          .eq('spot_id', spotId);
          
        if (typeError) throw typeError;
        
        const { data: advantageData, error: advantageError } = await supabase
          .from('astro_spot_advantages')
          .select('*')
          .eq('spot_id', spotId);
          
        if (advantageError) throw advantageError;
        
        console.log('Fetched types:', typeData);
        console.log('Fetched advantages:', advantageData);
        
        return {
          types: typeData.map(type => type.type_name),
          advantages: advantageData.map(advantage => advantage.advantage_name)
        };
        
      } catch (error) {
        console.error('Error fetching spot data:', error);
        toast.error(t("Failed to load spot data", "加载观星点数据失败"));
        return { types: [], advantages: [] };
      }
    }
    return { types: [], advantages: [] };
  };

  return { fetchExistingData };
};
