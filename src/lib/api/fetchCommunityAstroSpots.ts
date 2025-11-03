
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch all astrospots created by users from Supabase with retry logic
 */
export async function fetchCommunityAstroSpots(retryCount = 0): Promise<any[]> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;
  
  try {
    console.log(`🚀 Starting fetchCommunityAstroSpots (attempt ${retryCount + 1})...`);
    
    // Add a small delay before retry to avoid overwhelming the server
    if (retryCount > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
    }
    
    // Direct Supabase query with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
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
      .limit(50)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (spotsError) {
      console.error('❌ Error fetching spots:', spotsError);
      
      // Retry on network errors
      if (retryCount < MAX_RETRIES && (
        spotsError.message?.includes('Load failed') ||
        spotsError.message?.includes('fetch failed') ||
        spotsError.message?.includes('Network')
      )) {
        console.log(`🔄 Retrying fetch (${retryCount + 1}/${MAX_RETRIES})...`);
        return fetchCommunityAstroSpots(retryCount + 1);
      }
      
      throw spotsError;
    }

    console.log('📊 Raw spots data:', { 
      count: spotsData?.length || 0,
      firstSpot: spotsData?.[0],
      allSpotTypes: spotsData?.map(s => s.spot_type)
    });

    if (!spotsData || spotsData.length === 0) {
      console.log('ℹ️ No spots found, returning empty array');
      return [];
    }

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
  } catch (error: any) {
    console.error("❌ Failed to fetch community astro spots:", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      retryCount
    });
    
    // Retry on network errors
    if (retryCount < MAX_RETRIES && (
      error?.message?.includes('Load failed') ||
      error?.message?.includes('fetch failed') ||
      error?.message?.includes('Network') ||
      error?.message?.includes('aborted')
    )) {
      console.log(`🔄 Retrying after error (${retryCount + 1}/${MAX_RETRIES})...`);
      return fetchCommunityAstroSpots(retryCount + 1);
    }
    
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
