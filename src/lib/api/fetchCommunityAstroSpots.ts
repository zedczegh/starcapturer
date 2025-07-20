
import { fetchFromSupabase } from "@/utils/supabaseFetch";

/**
 * Fetch all astrospots created by users from Supabase.
 * Optimized with parallel processing, caching, and better error handling.
 */
export async function fetchCommunityAstroSpots() {
  try {
    // Use our optimized fetch utility with stronger caching
    const data = await fetchFromSupabase<any[]>(
      "user_astro_spots",
      (query) => query
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
          verification_status
        `)
        .order("created_at", { ascending: false })
        .limit(50),
      {
        ttl: 5 * 60 * 1000, // 5 minutes cache
        persistToStorage: true,
        namespace: 'community-spots-list' // Use namespace instead of cacheKey
      }
    );

    // Get booking availability for each spot
    const spotsWithBookings = await Promise.all(
      (data || []).map(async (spot: any) => {
        try {
          // Count available time slots for this spot
          const availabilityData = await fetchFromSupabase<any[]>(
            "astro_spot_timeslots",
            (query) => query
              .select("id")
              .eq("spot_id", spot.id)
              .gte("start_time", new Date().toISOString()),
            {
              ttl: 2 * 60 * 1000, // 2 minutes cache for availability
              namespace: `spot-availability-${spot.id}`
            }
          );
          
          const availableBookings = availabilityData?.length || 0;
          
          return {
            id: spot.id,
            name: spot.name,
            latitude: Number(spot.latitude),
            longitude: Number(spot.longitude),
            bortleScale: spot.bortlescale ?? 4,
            siqs: spot.siqs,
            description: spot.description,
            timestamp: spot.created_at,
            user_id: spot.user_id,
            verification_status: spot.verification_status,
            availableBookings: availableBookings
          };
        } catch (error) {
          console.error(`Error fetching availability for spot ${spot.id}:`, error);
          return {
            id: spot.id,
            name: spot.name,
            latitude: Number(spot.latitude),
            longitude: Number(spot.longitude),
            bortleScale: spot.bortlescale ?? 4,
            siqs: spot.siqs,
            description: spot.description,
            timestamp: spot.created_at,
            user_id: spot.user_id,
            verification_status: spot.verification_status,
            availableBookings: 0
          };
        }
      })
    );
    
    return spotsWithBookings;
  } catch (error) {
    console.error("Failed to fetch community astro spots:", error);
    return [];
  }
}

/**
 * Prefetch community spots into cache
 */
export function prefetchCommunityAstroSpots(): Promise<void> {
  // Make the request in the background and don't wait for it
  Promise.resolve().then(() => {
    return fetchCommunityAstroSpots();
  }).catch(error => {
    console.error("Error prefetching community spots:", error);
  });
  
  return Promise.resolve();
}
