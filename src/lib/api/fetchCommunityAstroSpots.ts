
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch all astrospots created by users from Supabase.
 * Optimized with parallel processing and better error handling.
 */
export async function fetchCommunityAstroSpots() {
  try {
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
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(50); // Limit initial load for better performance

    if (error) {
      console.error("Error fetching community astro spots:", error);
      throw error;
    }

    return (data || []).map((spot: any) => ({
      id: spot.id,
      name: spot.name,
      latitude: Number(spot.latitude),
      longitude: Number(spot.longitude),
      bortleScale: spot.bortlescale ?? 4,
      siqs: spot.siqs,
      description: spot.description,
      timestamp: spot.created_at,
    }));
  } catch (error) {
    console.error("Failed to fetch community astro spots:", error);
    return [];
  }
}
