
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch all astrospots created by users from Supabase.
 */
export async function fetchCommunityAstroSpots() {
  try {
    console.log('🚀 Starting fetchCommunityAstroSpots...');
    
    // Direct Supabase query - bypass cache utility for now
    const { data: spotsData, error: spotsError } = await supabase
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
        verification_status,
        spot_type
      `)
      .neq("verification_status", "rejected")
      .order("created_at", { ascending: false })
      .limit(50);

    if (spotsError) {
      console.error('❌ Error fetching spots:', spotsError);
      throw spotsError;
    }

    console.log('📊 Raw spots data:', { 
      count: spotsData?.length || 0,
      firstSpot: spotsData?.[0],
      allSpotTypes: spotsData?.map(s => s.spot_type)
    });

    // Process spots with booking availability
    const spotsWithBookings = await Promise.all(
      (spotsData || []).map(async (spot: any) => {
        try {
          const { data: availabilityData } = await supabase
            .from("astro_spot_timeslots")
            .select("id")
            .eq("spot_id", spot.id)
            .gte("start_time", new Date().toISOString());
          
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
            availableBookings: availabilityData?.length || 0,
            spot_type: spot.spot_type || 'nightscape'
          };
        } catch (error) {
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
            availableBookings: 0,
            spot_type: spot.spot_type || 'nightscape'
          };
        }
      })
    );
    
    console.log('🎯 Returning', spotsWithBookings.length, 'spots');
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
