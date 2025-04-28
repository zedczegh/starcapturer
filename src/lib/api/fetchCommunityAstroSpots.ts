
import { supabase } from "@/integrations/supabase/client";
import { spotCacheService } from "@/services/location/spotCacheService";

export async function fetchCommunityAstroSpots() {
  try {
    const cachedSpots = spotCacheService.getCachedSpots(0, 0, 0, 50);
    if (cachedSpots) {
      console.log("Using cached community spots");
      return cachedSpots;
    }

    // First fetch the spots
    const { data: spots, error: spotsError } = await supabase
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
        user_id
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (spotsError) {
      console.error("Error fetching community astro spots:", spotsError);
      throw spotsError;
    }

    // Then fetch usernames separately to avoid join issues
    const userIds = spots.map(spot => spot.user_id).filter(Boolean);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching user profiles:", profilesError);
    }

    // Create a map of user IDs to usernames
    const usernameMap = new Map();
    if (profiles && profiles.length > 0) {
      profiles.forEach(profile => {
        usernameMap.set(profile.id, profile.username);
      });
    }

    const formattedData = (spots || []).map((spot: any) => ({
      id: spot.id,
      name: spot.name,
      latitude: Number(spot.latitude),
      longitude: Number(spot.longitude),
      bortleScale: spot.bortlescale ?? 4,
      siqs: spot.siqs,
      description: spot.description,
      timestamp: spot.created_at,
      username: usernameMap.get(spot.user_id) || 'Anonymous Stargazer'
    }));

    spotCacheService.cacheSpots(0, 0, 0, 50, formattedData);
    return formattedData;
  } catch (error) {
    console.error("Failed to fetch community astro spots:", error);
    return [];
  }
}
