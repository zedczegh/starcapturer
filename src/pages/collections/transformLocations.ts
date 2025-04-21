
import { SharedAstroSpot } from "@/lib/api/astroSpots";

/**
 * Maps raw Supabase saved_locations rows to strict SharedAstroSpot shape.
 *
 * This function's logic should be tested and must remain in sync
 * with both database schema and SharedAstroSpot.
 */
export function transformSavedLocations(
  data: any[] | null
): SharedAstroSpot[] {
  if (!data) return [];
  return data.map((loc) => ({
    id: loc.id,
    name: loc.name,
    latitude: typeof loc.latitude === "string" ? Number(loc.latitude) : loc.latitude,
    longitude: typeof loc.longitude === "string" ? Number(loc.longitude) : loc.longitude,
    bortleScale: loc.bortlescale || 4, // Map DB 'bortlescale' to camelCase
    siqs: loc.siqs, // Could be number or object depending on logic elsewhere
    certification: loc.certification || null,
    isDarkSkyReserve: loc.isdarkskyreserve || false, // Map DB 'isdarkskyreserve' to camelCase
    timestamp: loc.timestamp || new Date().toISOString(),
  }));
}
