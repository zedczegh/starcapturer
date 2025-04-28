
import { supabase } from "@/integrations/supabase/client";
import { spotCacheService } from "@/services/location/spotCacheService";

export async function fetchCommunityAstroSpots() {
  try {
    const cachedSpots = spotCacheService.getCachedSpots(0, 0, 0, 50);
    if (cachedSpots) {
      console.log("Using cached community spots");
      return cachedSpots;
    }

    const { data, error } = await supabase
      .from("user_astro_spots")
      .select(`
        id,
        name,
        latitude,
        longitude,
        bortlescale,
        siqs,
        description,
        created_at,
        profiles (
          username
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching community astro spots:", error);
      throw error;
    }

    const formattedData = (data || []).map((spot: any) => ({
      id: spot.id,
      name: spot.name,
      latitude: Number(spot.latitude),
      longitude: Number(spot.longitude),
      bortleScale: spot.bortlescale ?? 4,
      siqs: spot.siqs,
      description: spot.description,
      timestamp: spot.created_at,
      username: spot.profiles?.username || 'Anonymous Stargazer'
    }));

    spotCacheService.cacheSpots(0, 0, 0, 50, formattedData);
    return formattedData;
  } catch (error) {
    console.error("Failed to fetch community astro spots:", error);
    return [];
  }
}
