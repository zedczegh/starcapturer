
import { supabase } from "@/integrations/supabase/client";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { isWaterLocation } from "@/utils/validation";

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
  // Transform the data to match SharedAstroSpot interface
  return (data ?? []).map(spot => ({
    id: spot.id,
    name: spot.name,
    latitude: spot.latitude,
    longitude: spot.longitude,
    siqs: spot.siqs,
    bortleScale: spot.bortlescale || 4, // Convert bortlescale to bortleScale
    timestamp: new Date().toISOString(), // Add required timestamp property
    isUserAstroSpot: true, // Mark as user-created for filtering
    description: spot.description
  }));
}

/**
 * Filters locations based on user location and search radius
 * @param locations Array of locations to filter
 * @param userLocation Current user location
 * @param searchRadius Search radius in kilometers
 * @param activeView Current active view mode
 * @returns Filtered locations array
 */
export function filterLocations(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] {
  if (!locations || locations.length === 0) return [];

  // In certified view, only show certified locations and user spots
  if (activeView === 'certified') {
    return locations.filter(loc => loc.isDarkSkyReserve || loc.certification || loc.isUserAstroSpot);
  }
  
  // For calculated view, show all locations within radius
  // BUT: always show certified locations regardless of distance
  if (!userLocation) return locations;
  
  return locations.filter(loc => {
    // Always show certified locations and user spots
    if (loc.isDarkSkyReserve || loc.certification || loc.isUserAstroSpot) return true;
    
    // For regular locations, check distance
    if (loc.distance !== undefined) {
      return loc.distance <= searchRadius;
    }
    
    return true;
  });
}

/**
 * Optimizes locations for mobile display by limiting the number shown
 * @param locations Array of locations to optimize
 * @param isMobile Whether the current device is mobile
 * @param activeView Current active view mode
 * @returns Optimized locations array
 */
export function optimizeLocationsForMobile(
  locations: SharedAstroSpot[],
  isMobile: boolean,
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] {
  if (!isMobile || locations.length <= 100) return locations;
  
  // On mobile, limit the number of displayed locations to improve performance
  // But always show certified locations and user-created spots
  const certifiedAndUserSpots = locations.filter(
    loc => loc.isDarkSkyReserve || loc.certification || loc.isUserAstroSpot
  );
  
  const regularLocations = locations.filter(
    loc => !(loc.isDarkSkyReserve || loc.certification || loc.isUserAstroSpot)
  );
  
  // For regular locations, take a smaller subset on mobile
  const limitedRegularLocations = regularLocations.slice(0, 50);
  
  return [...certifiedAndUserSpots, ...limitedRegularLocations];
}
