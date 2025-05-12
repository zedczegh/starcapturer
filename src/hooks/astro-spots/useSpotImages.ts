
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from 'react-router-dom';

export const useSpotImages = (spotId: string, refreshTrigger: number) => {
  const location = useLocation();
  const noRefresh = location.state?.noRefresh;
  
  // Spot images query
  const { data: spotImages = [], isLoading: loadingImages, refetch: refetchImages } = useQuery({
    queryKey: ['spotImages', spotId, refreshTrigger],
    queryFn: async () => {
      if (!spotId) return [];
      
      try {
        console.log("Fetching images for spot:", spotId, "noRefresh:", noRefresh);
        
        const { data: files, error } = await supabase
          .storage
          .from('astro_spot_images')
          .list(spotId);
          
        if (error) {
          console.error("Error listing files:", error);
          return [];
        }
        
        if (!files || files.length === 0) {
          console.log("No images found for spot:", spotId);
          return [];
        }
        
        console.log("Found", files.length, "images for spot:", spotId);
        
        return files.map(file => {
          const { data } = supabase
            .storage
            .from('astro_spot_images')
            .getPublicUrl(`${spotId}/${file.name}`);
          return data.publicUrl;
        });
      } catch (error) {
        console.error("Error fetching spot images:", error);
        return [];
      }
    },
    enabled: !!spotId,
    staleTime: noRefresh ? 1000 * 60 * 5 : 1000 * 15 // Longer stale time when coming from marker
  });

  return { spotImages, loadingImages, refetchImages };
};

export default useSpotImages;
