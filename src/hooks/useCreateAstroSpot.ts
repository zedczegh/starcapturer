import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const validateForm = (): string | null => {
    if (!user) {
      return "You must be logged in to create an astro spot";
    }
    if (!formData.locationName.trim()) {
      return "Location name is required";
    }
    if (!isAdmin && formData.selectedTypes.length === 0) {
      return "Please select at least one location type";
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
      if (!userIdToUse) throw new Error("User ID not found");

      if (isEditing && spotId) {
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

        toast.success("Astro spot created successfully!");
        navigate(`/location/${formData.latitude.toFixed(6)},${formData.longitude.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Error handling astro spot:', error);
      toast.error(isEditing ? "Error updating astro spot" : "Error creating astro spot");
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
