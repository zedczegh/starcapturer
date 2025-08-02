
import { fetchFromSupabase } from "@/utils/supabaseFetch";

/**
 * Fetch all astrospots created by users from Supabase.
 * Optimized with parallel processing, caching, and better error handling.
 */
export async function fetchCommunityAstroSpots() {
  try {
    console.log('🚀 Starting fetchCommunityAstroSpots...');
    
    // Use our optimized fetch utility with NO CACHE to force fresh data
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
        .neq("verification_status", "rejected") // Hide rejected spots from community
        .order("created_at", { ascending: false })
        .limit(50),
      {
        skipCache: true, // Force no cache
        forceRefresh: true // Force refresh
      }
    );

    console.log('📊 Raw spots data:', { 
      count: data?.length || 0,
      firstSpot: data?.[0],
      allSpots: data
    });

    // Get booking availability for each spot
    const spotsWithBookings = await Promise.all(
      (data || []).map(async (spot: any) => {
        try {
          console.log(`🔍 Fetching availability for spot: ${spot.name} (${spot.id})`);
          
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
          
          console.log(`📅 Spot ${spot.name} has ${availableBookings} available bookings`);
          
          const result = {
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
          
          console.log(`✅ Processed spot: ${spot.name}`, result);
          return result;
        } catch (error) {
          console.error(`❌ Error fetching availability for spot ${spot.id}:`, error);
          const result = {
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
          
          console.log(`⚠️ Fallback result for spot: ${spot.name}`, result);
          return result;
        }
      })
    );
    
    console.log('🎯 Final processed spots:', {
      count: spotsWithBookings.length,
      spots: spotsWithBookings
    });
    
    return spotsWithBookings;
  } catch (error) {
    console.error("❌ Failed to fetch community astro spots:", error);
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
