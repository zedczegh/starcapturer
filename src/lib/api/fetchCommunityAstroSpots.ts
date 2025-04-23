
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch all astrospots created by users from Supabase.
 * Returns an array of spots with SIQS, Bortle, name, description, etc.
 * Now also joins profiles to provide username.
 */
export async function fetchCommunityAstroSpots() {
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
      user_id,
      profiles (
        username
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching community astro spots:", error);
    return [];
  }
  // Map to the expected structure for SharedAstroSpot
  return (data || []).map((spot: any) => ({
    id: spot.id,
    name: spot.name,
    latitude: Number(spot.latitude),
    longitude: Number(spot.longitude),
    bortleScale: spot.bortlescale ?? 4,
    siqs: spot.siqs,
    description: spot.description,
    timestamp: spot.created_at,
    username: spot.profiles?.username ?? undefined,
    user_id: spot.user_id ?? undefined,
    // Optionally add more fields as needed
  }));
}
