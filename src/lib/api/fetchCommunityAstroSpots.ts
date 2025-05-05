
import { supabase } from "@/integrations/supabase/client";
import { spotCacheService } from "@/services/location/spotCacheService";

export async function fetchCommunityAstroSpots() {
  try {
    // Check cache first - this is super fast
    const cachedSpots = spotCacheService.getCachedSpots(0, 0, 0, 50);
    if (cachedSpots) {
      return cachedSpots;
    }

    console.time('fetchCommunitySpots');
    
    // First fetch the spots with a more optimized query
    // Limit fields to only what's needed
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

    console.timeEnd('fetchCommunitySpots');

    if (spotsError) {
      console.error("Error fetching community astro spots:", spotsError);
      throw spotsError;
    }

    if (!spots || spots.length === 0) {
      return [];
    }

    // Then fetch usernames separately only for existing user_ids
    // Filter out null/undefined user_ids first to avoid query errors
    const userIds = spots
      .map(spot => spot.user_id)
      .filter(Boolean);
      
    // Only fetch profiles if there are valid user IDs
    let profiles = [];
    if (userIds && userIds.length > 0) {
      console.time('fetchUserProfiles');
      
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);
        
      console.timeEnd('fetchUserProfiles');
      
      if (!profilesError && profilesData) {
        profiles = profilesData;
      } else if (profilesError) {
        console.error("Error fetching user profiles:", profilesError);
        // Continue with the spots even if profile fetch fails
      }
    }

    // Create a map of user IDs to usernames for O(1) lookup
    const usernameMap = new Map();
    if (profiles && profiles.length > 0) {
      profiles.forEach(profile => {
        if (profile && profile.id) {
          usernameMap.set(profile.id, profile.username);
        }
      });
    }

    // Map the data once with fast lookup
    console.time('formatData');
    const formattedData = (spots || []).map((spot) => ({
      id: spot.id,
      name: spot.name,
      latitude: Number(spot.latitude),
      longitude: Number(spot.longitude),
      bortleScale: spot.bortlescale ?? 4,
      siqs: spot.siqs,
      description: spot.description,
      timestamp: spot.created_at,
      username: spot.user_id ? (usernameMap.get(spot.user_id) || 'Anonymous Stargazer') : 'Anonymous Stargazer'
    }));
    console.timeEnd('formatData');

    // Cache the result for future requests
    spotCacheService.cacheSpots(0, 0, 0, 50, formattedData);
    return formattedData;
  } catch (error) {
    console.error("Failed to fetch community astro spots:", error);
    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
}
