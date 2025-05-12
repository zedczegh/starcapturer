
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
        { skipCache: refreshTrigger > 0 }
      );
      
      if (!spotData) throw new Error("Spot not found");

      // Fetch related data in parallel for better performance
      const [typeData, advantageData] = await Promise.all([
        fetchFromSupabase(
          "astro_spot_types",
          (query) => query.select('*').eq('spot_id', spotId),
          { skipCache: refreshTrigger > 0 }
        ),
        fetchFromSupabase(
          "astro_spot_advantages",
          (query) => query.select('*').eq('spot_id', spotId),
          { skipCache: refreshTrigger > 0 }
        )
      ]);
      
      return {
        ...spotData,
        astro_spot_types: typeData || [],
        astro_spot_advantages: advantageData || [],
      };
    },
    retry: 1,
    staleTime: 1000 * 15,
    refetchOnWindowFocus: false
  });

  return { spot, isLoading, error, refetch };
};

export default useSpotData;
