
import { SharedAstroSpot } from "@/lib/api/astroSpots";

/**
 * Remove duplicate locations from the array based on coordinates
 */
export function removeDuplicateLocations(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  const seen = new Map<string, boolean>();
  return locations.filter(loc => {
    // Skip invalid locations
    if (!loc.latitude || !loc.longitude) return false;
    
    // Create a key with reduced precision (0.001° ≈ 100m)
    const key = `${loc.latitude.toFixed(3)}-${loc.longitude.toFixed(3)}`;
    
    if (seen.has(key)) {
      return false;
    }
    
    seen.set(key, true);
    return true;
  });
}

/**
 * Prioritize locations based on quality metrics
 */
export function prioritizeLocations(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    // First prioritize dark sky reserves and certified locations
    if (a.isDarkSkyReserve && !b.isDarkSkyReserve) return -1;
    if (!a.isDarkSkyReserve && b.isDarkSkyReserve) return 1;
    
    // Then by certification
    if (a.certification && !b.certification) return -1;
    if (!a.certification && b.certification) return 1;
    
    // Then by SIQS if available
    if (a.siqs && b.siqs) {
      return b.siqs - a.siqs;
    }
    
    // Then by Bortle scale (lower is better)
    return (a.bortleScale || 5) - (b.bortleScale || 5);
  });
}

/**
 * Estimate Bortle scale based on location name and coordinates
 */
export function estimateBortleScaleByLocation(locationName: string, latitude: number, longitude: number): number {
  const name = locationName.toLowerCase();
  
  // City detection
  if (
    name.includes("city") || 
    name.includes("town") ||
    name.includes("village") ||
    name.includes("urban") ||
    name.includes("downtown")
  ) {
    return 6; // Urban/suburban transition
  }
  
  // Park detection
  if (
    name.includes("park") || 
    name.includes("reserve") ||
    name.includes("forest") ||
    name.includes("wilderness") ||
    name.includes("conservation")
  ) {
    return 4; // Rural transition
  }
  
  // Mountain detection
  if (
    name.includes("mountain") || 
    name.includes("peak") ||
    name.includes("summit") ||
    name.includes("hill")
  ) {
    return 3; // Rural
  }
  
  // Desert, remote locations
  if (
    name.includes("desert") || 
    name.includes("remote") ||
    name.includes("observatory")
  ) {
    return 2; // Truly dark sky
  }
  
  // Default based on latitude (cities tend to be in mid-latitudes)
  if (Math.abs(latitude) > 60) {
    return 3; // High latitudes tend to be less populated
  }
  
  return 5; // Default: suburban
}

export function findClosestKnownLocation(latitude: number, longitude: number) {
  // This is a simplified implementation
  return {
    bortleScale: estimateBortleScaleByLocation('unknown', latitude, longitude),
    distance: 50
  };
}
