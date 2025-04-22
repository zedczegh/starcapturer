
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface CreateAstroSpotForm {
  locationName: string;
  selectedTypes: string[];
  selectedAdvantages: string[];
  description: string;
  images: File[];
  latitude: number;
  longitude: number;
}

export const useCreateAstroSpot = (
  initialLatitude: number, 
  initialLongitude: number, 
  initialName?: string,
  isEditing = false,
  spotId?: string,
  initialDescription = ''
) => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [formData, setFormData] = useState<CreateAstroSpotForm>({
    locationName: initialName || '',
    selectedTypes: [],
    selectedAdvantages: [],
    description: initialDescription,
    images: [],
    latitude: initialLatitude,
    longitude: initialLongitude,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    // Fetch existing spot types and advantages when editing
    const fetchExistingData = async () => {
      if (isEditing && spotId) {
        try {
          // Fetch spot types
          const { data: typeData, error: typeError } = await supabase
            .from('astro_spot_types')
            .select('*')
            .eq('spot_id', spotId);
            
          if (typeError) throw typeError;
          
          // Fetch spot advantages
          const { data: advantageData, error: advantageError } = await supabase
            .from('astro_spot_advantages')
            .select('*')
            .eq('spot_id', spotId);
            
          if (advantageError) throw advantageError;
          
          setFormData(prev => ({
            ...prev,
            selectedTypes: typeData.map(type => type.type_name),
            selectedAdvantages: advantageData.map(advantage => advantage.advantage_name)
          }));
          
        } catch (error) {
          console.error('Error fetching spot data:', error);
          toast.error(t("Failed to load spot data", "加载观星点数据失败"));
        }
      }
    };
    
    fetchExistingData();
  }, [isEditing, spotId, t]);

  const validateForm = (): string | null => {
    if (!user) {
      return t("You must be logged in to create an astro spot", "您必须登录才能创建观星点");
    }
    if (!formData.locationName.trim()) {
      return t("Location name is required", "位置名称是必填项");
    }
    if (!isAdmin && formData.selectedTypes.length === 0) {
      return t("Please select at least one location type", "请至少选择一个位置类型");
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const userIdToUse = user?.id;
      if (!userIdToUse) throw new Error(t("User ID not found", "未找到用户ID"));

      if (isEditing && spotId) {
        console.log("Updating astro spot with data:", {
          name: formData.locationName,
          description: formData.description,
          latitude: formData.latitude,
          longitude: formData.longitude
        });
        
        const { error: spotError } = await supabase
          .from('user_astro_spots')
          .update({
            name: formData.locationName,
            description: formData.description,
            latitude: formData.latitude,
            longitude: formData.longitude,
          })
          .eq('id', spotId);

        if (spotError) throw spotError;

        // Delete existing types then insert new ones
        await supabase
          .from('astro_spot_types')
          .delete()
          .eq('spot_id', spotId);

        if (formData.selectedTypes.length > 0) {
          const { error: typesError } = await supabase
            .from('astro_spot_types')
            .insert(formData.selectedTypes.map(type => ({
              spot_id: spotId,
              type_name: type
            })));

          if (typesError) throw typesError;
        }

        // Delete existing advantages then insert new ones
        await supabase
          .from('astro_spot_advantages')
          .delete()
          .eq('spot_id', spotId);

        if (formData.selectedAdvantages.length > 0) {
          const { error: advantagesError } = await supabase
            .from('astro_spot_advantages')
            .insert(formData.selectedAdvantages.map(advantage => ({
              spot_id: spotId,
              advantage_name: advantage
            })));

          if (advantagesError) throw advantagesError;
        }

        toast.success(t("Astro spot updated successfully!", "观星点更新成功！"));
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
          const imagePromises = formData.images.map(async (image, index) => {
            const fileName = `${userIdToUse}/${spot.id}/${Date.now()}_${index}.${image.name.split('.').pop()}`;
            const { error: uploadError } = await supabase.storage
              .from('astro_spot_images')
              .upload(fileName, image);
            
            if (uploadError) throw uploadError;
          });

          await Promise.all(imagePromises);
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

        toast.success(t("Astro spot created successfully!", "观星点创建成功！"));
        navigate(`/location/${formData.latitude.toFixed(6)},${formData.longitude.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Error handling astro spot:', error);
      toast.error(isEditing 
        ? t("Error updating astro spot", "更新观星点时出错") 
        : t("Error creating astro spot", "创建观星点时出错")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    isSubmitting,
    handleSubmit,
  };
};
