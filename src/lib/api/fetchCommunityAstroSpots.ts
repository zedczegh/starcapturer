
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
        user_id,
        default_price,
        currency
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (spotsError) {
      console.error("Error fetching community astro spots:", spotsError);
      throw spotsError;
    }

    // Then fetch usernames separately to avoid join issues
    // Make sure spots exist and have user_ids before trying to filter
    const userIds = spots && spots.length > 0 
      ? spots.map(spot => spot.user_id).filter(Boolean)
      : [];
      
    // Only fetch profiles if there are user IDs to fetch
    let profiles = [];
    if (userIds.length > 0) {
      const { data: profileData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching user profiles:", profilesError);
      } else if (profileData) {
        profiles = profileData;
      }
    }

    // Create a map of user IDs to usernames and avatars
    const profileMap = new Map();
    if (profiles && profiles.length > 0) {
      profiles.forEach(profile => {
        profileMap.set(profile.id, {
          username: profile.username,
          avatar_url: profile.avatar_url
        });
      });
    }

    const formattedData = (spots || []).map((spot: any) => {
      const profile = spot.user_id && profileMap.get(spot.user_id) || { username: 'Anonymous Stargazer', avatar_url: null };
      
      return {
        id: spot.id,
        name: spot.name,
        latitude: Number(spot.latitude),
        longitude: Number(spot.longitude),
        bortleScale: spot.bortlescale ?? 4,
        siqs: spot.siqs,
        description: spot.description,
        timestamp: spot.created_at,
        username: profile.username || 'Anonymous Stargazer',
        user_id: spot.user_id, // Include the user_id for avatar lookup
        default_price: spot.default_price,
        currency: spot.currency
      };
    });

    spotCacheService.cacheSpots(0, 0, 0, 50, formattedData);
    return formattedData;
  } catch (error) {
    console.error("Failed to fetch community astro spots:", error);
    return [];
  }
}
