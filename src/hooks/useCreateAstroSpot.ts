
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQueryClient } from '@tanstack/react-query';
import { useSpotDataFetcher } from './astro-spots/useSpotDataFetcher';
import { useSpotFormValidation } from './astro-spots/useSpotFormValidation';
import { useSpotImageUpload } from './astro-spots/useSpotImageUpload';
import { useUserRole } from './useUserRole';

export const useCreateAstroSpot = (
  initialLatitude: number, 
  initialLongitude: number, 
  initialName?: string,
  isEditing = false,
  spotId?: string,
  initialDescription = ''
) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { fetchExistingData } = useSpotDataFetcher(isEditing, spotId);
  const { validateForm } = useSpotFormValidation();
  const { uploadImages } = useSpotImageUpload();
  const { isAdmin } = useUserRole();

  const [formData, setFormData] = useState({
    locationName: initialName || '',
    selectedTypes: [] as string[],
    selectedAdvantages: [] as string[],
    description: initialDescription,
    images: [] as File[],
    latitude: initialLatitude,
    longitude: initialLongitude,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      const data = await fetchExistingData();
      setFormData(prev => ({
        ...prev,
        selectedTypes: data.types,
        selectedAdvantages: data.advantages
      }));
    };
    
    initializeData();
  }, [isEditing, spotId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm(formData.locationName, formData.selectedTypes);
    if (validationError) {
      toast.error(t(validationError));
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);
    
    try {
      const userIdToUse = user?.id;
      if (!userIdToUse) throw new Error(t("User ID not found", "未找到用户ID"));

      if (isEditing && spotId) {
        console.log("Updating astro spot with data:", {
          name: formData.locationName,
          description: formData.description,
          latitude: formData.latitude,
          longitude: formData.longitude,
          selectedTypes: formData.selectedTypes,
          selectedAdvantages: formData.selectedAdvantages
        });
        
        const { error: spotError } = await supabase
          .from('user_astro_spots')
          .update({
            name: formData.locationName,
            description: formData.description,
            latitude: formData.latitude,
            longitude: formData.longitude,
            updated_at: new Date().toISOString()
          })
          .eq('id', spotId);

        if (spotError) throw spotError;

        console.log("Astro spot updated successfully, now updating types");
        
        const { error: deleteTypesError } = await supabase
          .from('astro_spot_types')
          .delete()
          .eq('spot_id', spotId);

        if (deleteTypesError) throw deleteTypesError;

        if (formData.selectedTypes.length > 0) {
          const { error: typesError } = await supabase
            .from('astro_spot_types')
            .insert(formData.selectedTypes.map(type => ({
              spot_id: spotId,
              type_name: type
            })));

          if (typesError) throw typesError;
        }

        console.log("Types updated successfully, now updating advantages");
        
        const { error: deleteAdvantagesError } = await supabase
          .from('astro_spot_advantages')
          .delete()
          .eq('spot_id', spotId);

        if (deleteAdvantagesError) throw deleteAdvantagesError;

        if (formData.selectedAdvantages.length > 0) {
          const { error: advantagesError } = await supabase
            .from('astro_spot_advantages')
            .insert(formData.selectedAdvantages.map(advantage => ({
              spot_id: spotId,
              advantage_name: advantage
            })));

          if (advantagesError) throw advantagesError;
        }

        if (formData.images.length > 0) {
          await uploadImages(formData.images, userIdToUse, spotId);
        }

        queryClient.invalidateQueries({ queryKey: ['astroSpot', spotId] });
        
        toast.success(t("Astro spot updated successfully!", "观星点更新成功！"));
        setIsSuccess(true);
        navigate(`/astro-spot/${spotId}`);
      } else {
        const { data: spot, error: spotError } = await supabase
          .from('user_astro_spots')
          .insert({
            name: formData.locationName,
            description: formData.description,
            latitude: formData.latitude,
            longitude: formData.longitude,
            user_id: userIdToUse
          })
          .select()
          .single();

        if (spotError) throw spotError;

        if (formData.images.length > 0) {
          await uploadImages(formData.images, userIdToUse, spot.id);
        }

        if (isAdmin || formData.selectedTypes.length > 0) {
          const { error: typesError } = await supabase
            .from('astro_spot_types')
            .insert(formData.selectedTypes.map(type => ({
              spot_id: spot.id,
              type_name: type
            })));

          if (typesError) throw typesError;
        }

        if (isAdmin || formData.selectedAdvantages.length > 0) {
          const { error: advantagesError } = await supabase
            .from('astro_spot_advantages')
            .insert(formData.selectedAdvantages.map(advantage => ({
              spot_id: spot.id,
              advantage_name: advantage
            })));

          if (advantagesError) throw advantagesError;
        }

        setIsSuccess(true);
        toast.success(t("Astro spot created successfully!", "观星点创建成功！"));
        navigate(`/location/${formData.latitude.toFixed(6)},${formData.longitude.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Error handling astro spot:', error);
      toast.error(isEditing 
        ? t("Error updating astro spot", "更新观星点时出错") 
        : t("Error creating astro spot", "创建观星点时出错")
      );
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    isSubmitting,
    handleSubmit,
    isSuccess,
  };
};
