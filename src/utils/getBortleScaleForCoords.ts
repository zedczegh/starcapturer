
import { getBortleScaleData } from "@/services/environmentalDataService/bortleScaleService";

// Simple in-memory cache for session data
const cache = new Map<string, number>();

/**
 * Get Bortle scale for given lat/lng, with in-memory caching. Returns null if failed.
 */
export async function getBortleScaleForCoords(
  latitude: number, 
  longitude: number, 
  originalName: string
): Promise<number | null> {
  const cacheKey = `${latitude.toFixed(5)}-${longitude.toFixed(5)}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    const found = await getBortleScaleData(
      latitude, 
      longitude,
      originalName || "",
      null,
      true, // display only (for quick queries)
      () => undefined, // no cache getter
      () => {}, // no cache setter
      "en"
    );
    if (found != null) cache.set(cacheKey, found);
    return found ?? null;
  } catch {
    return null;
  }
}
