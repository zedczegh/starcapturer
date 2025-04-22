
import { supabase } from "@/integrations/supabase/client";
import { SharedAstroSpot } from "@/lib/api/astroSpots";

/**
 * Loads all user-created astro spots from Supabase for map display.
 * @returns Promise<SharedAstroSpot[]>
 */
export async function fetchUserAstroSpots(): Promise<SharedAstroSpot[]> {
  // Use .select() for user_astro_spots, selecting required fields
  const { data, error } = await supabase
    .from("user_astro_spots")
    .select("*");
  if (error) {
    console.error("Error loading user astro spots:", error);
    return [];
  }
  // Provide default structure for marker compatibility
  return (data ?? []).map(spot => ({
    ...spot,
    isUserAstroSpot: true // Mark as user-created for filtering
  }));
}
