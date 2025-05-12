
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from 'react-router-dom';
import { useRef } from 'react';

export const useSpotImages = (spotId: string, refreshTrigger: number = 0) => {
  const location = useLocation();
  const noRefresh = location.state?.noRefresh === true;
  const imagesCache = useRef<string[]>([]);
  
  // Spot images query with optimization for marker popup navigation
  const { data: spotImages = [], isLoading: loadingImages, refetch: refetchImages } = useQuery({
    queryKey: ['spotImages', spotId, refreshTrigger],
    queryFn: async () => {
      if (!spotId) return [];
      
      try {
        console.log("Fetching images for spot:", spotId, "refreshTrigger:", refreshTrigger, "noRefresh:", noRefresh);
        
        // Use cached images if we're in noRefresh mode and have previously fetched them
        if (noRefresh && imagesCache.current.length > 0) {
          console.log("Using cached images for spot:", spotId);
          return imagesCache.current;
        }
        
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
        
        const imageUrls = files.map(file => {
          const { data } = supabase
            .storage
            .from('astro_spot_images')
            .getPublicUrl(`${spotId}/${file.name}`);
          return data.publicUrl;
        });
        
        // Cache the images for potential marker popup navigation
        imagesCache.current = imageUrls;
        
        return imageUrls;
      } catch (error) {
        console.error("Error fetching spot images:", error);
        return [];
      }
    },
    enabled: !!spotId,
    staleTime: 1000 * 60, // Increased from 15 seconds to 1 minute
    refetchOnWindowFocus: false
  });

  return { spotImages, loadingImages, refetchImages };
};

export default useSpotImages;
