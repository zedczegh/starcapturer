
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

export const useSpotImages = (spotId: string, refreshTrigger: number = 0) => {
  // Spot images query with improved caching
  const { data: spotImages = [], isLoading: loadingImages, refetch: refetchImages } = useQuery({
    queryKey: ['spotImages', spotId, refreshTrigger],
    queryFn: async () => {
      if (!spotId) return [];
      
      try {
        console.log("Fetching images for spot:", spotId);
        
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
        
        // Use memory cache for images to prevent flickering
        const cachedUrls = sessionStorage.getItem(`spot-images-${spotId}`);
        if (cachedUrls && !refreshTrigger) {
          try {
            const parsed = JSON.parse(cachedUrls);
            if (parsed.timestamp > Date.now() - 1000 * 60 * 15) { // 15 min cache
              console.log("Using cached image URLs");
              return parsed.urls;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        
        const urls = files.map(file => {
          const { data } = supabase
            .storage
            .from('astro_spot_images')
            .getPublicUrl(`${spotId}/${file.name}`);
          return data.publicUrl;
        });
        
        // Cache the URLs in session storage to prevent flickering
        try {
          sessionStorage.setItem(`spot-images-${spotId}`, JSON.stringify({
            timestamp: Date.now(),
            urls
          }));
        } catch (e) {
          // Ignore storage errors
        }
        
        return urls;
      } catch (error) {
        console.error("Error fetching spot images:", error);
        return [];
      }
    },
    enabled: !!spotId,
    staleTime: 1000 * 60 * 5, // 5 minutes to reduce flickering
    refetchOnWindowFocus: false
  });

  return { spotImages, loadingImages, refetchImages };
};

export default useSpotImages;
