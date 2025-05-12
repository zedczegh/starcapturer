
import { useQuery } from '@tanstack/react-query';
import { fetchFromSupabase } from "@/utils/supabaseFetch";
import { useLocation } from 'react-router-dom';

export const useSpotData = (spotId: string, refreshTrigger: number = 0) => {
  const location = useLocation();
  const noRefresh = location.state?.noRefresh === true;
  
  // Main spot data query with optimization for marker popups
  const { data: spot, isLoading, error, refetch } = useQuery({
    queryKey: ['astroSpot', spotId, refreshTrigger],
    queryFn: async () => {
      if (!spotId) throw new Error("No spot ID provided");
      
      console.log(`Fetching spot data for ID: ${spotId}, refreshTrigger: ${refreshTrigger}, noRefresh: ${noRefresh}`);
      
      // Use optimized fetch for the main spot data
      const spotData = await fetchFromSupabase(
        "user_astro_spots",
        (query) => query.select('*').eq('id', spotId).single(),
        { 
          skipCache: refreshTrigger > 0 && !noRefresh,
          forceRefresh: refreshTrigger > 0 && !noRefresh
        }
      );
      
      if (!spotData) throw new Error("Spot not found");

      // Fetch related data in parallel for better performance
      // Don't force refresh if accessed from marker popup
      const [typeData, advantageData] = await Promise.all([
        fetchFromSupabase(
          "astro_spot_types",
          (query) => query.select('*').eq('spot_id', spotId),
          { 
            skipCache: refreshTrigger > 0 && !noRefresh,
            forceRefresh: false // Optimized: Never force refresh for types
          }
        ),
        fetchFromSupabase(
          "astro_spot_advantages",
          (query) => query.select('*').eq('spot_id', spotId),
          { 
            skipCache: refreshTrigger > 0 && !noRefresh,
            forceRefresh: false // Optimized: Never force refresh for advantages
          }
        )
      ]);
      
      return {
        ...spotData,
        astro_spot_types: typeData || [],
        astro_spot_advantages: advantageData || [],
      };
    },
    retry: 1,
    staleTime: 1000 * 60, // Increased from 15 seconds to 1 minute
    refetchOnWindowFocus: false,
    // Skip refreshing if coming from marker popup
    enabled: !!spotId
  });

  return { spot, isLoading, error, refetch };
};

export default useSpotData;
