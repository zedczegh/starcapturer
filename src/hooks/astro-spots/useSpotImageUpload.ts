
import { supabase } from "@/integrations/supabase/client";

export const useSpotImageUpload = () => {
  const uploadImages = async (images: File[], userId: string, spotId: string) => {
    if (!images.length) return;

    const imagePromises = images.map(async (image, index) => {
      const fileName = `${Date.now()}_${index}.${image.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('astro_spot_images')
        .upload(`${spotId}/${fileName}`, image, {
          upsert: true
        });
      
      if (uploadError) throw uploadError;
    });

    await Promise.all(imagePromises);
  };

  return { uploadImages };
};
