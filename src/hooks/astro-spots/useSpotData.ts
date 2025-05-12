
import { useQuery } from '@tanstack/react-query';
import { fetchFromSupabase } from "@/utils/supabaseFetch";

export const useSpotData = (spotId: string, refreshTrigger: number) => {
  // Main spot data query
  const { data: spot, isLoading, error, refetch } = useQuery({
    queryKey: ['astroSpot', spotId, refreshTrigger],
    queryFn: async () => {
      if (!spotId) throw new Error("No spot ID provided");
      
      // Use optimized fetch for the main spot data
      const spotData = await fetchFromSupabase(
        "user_astro_spots",
        (query) => query.select('*').eq('id', spotId).single(),
        { 
          skipCache: refreshTrigger > 0,
          namespace: `spot-data-${spotId}`,
          ttl: 5 * 60 * 1000, // 5 minutes cache
          persistToStorage: true  // Enable persisting to storage for production
        }
      );
      
      if (!spotData) throw new Error("Spot not found");

      // Fetch related data in parallel for better performance
      const [typeData, advantageData] = await Promise.all([
        fetchFromSupabase(
          "astro_spot_types",
          (query) => query.select('*').eq('spot_id', spotId),
          { 
            skipCache: refreshTrigger > 0,
            namespace: `spot-types-${spotId}`,
            ttl: 5 * 60 * 1000, // 5 minutes cache
            persistToStorage: true
          }
        ),
        fetchFromSupabase(
          "astro_spot_advantages",
          (query) => query.select('*').eq('spot_id', spotId),
          { 
            skipCache: refreshTrigger > 0,
            namespace: `spot-advantages-${spotId}`,
            ttl: 5 * 60 * 1000, // 5 minutes cache
            persistToStorage: true
          }
        )
      ]);
      
      return {
        ...spotData,
        astro_spot_types: typeData || [],
        astro_spot_advantages: advantageData || [],
      };
    },
    retry: 2, // Increase retry count for network issues
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
    gcTime: 10 * 60 * 1000, // 10 minutes cache retention
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // Don't refetch on reconnect to prevent flashing
    meta: {
      errorMessage: "Failed to load AstroSpot data"
    }
  });

  return { spot, isLoading, error, refetch };
};

export default useSpotData;
