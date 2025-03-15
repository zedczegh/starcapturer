
import { LocationEntry } from "../../locationDatabase";

export function processLocationsByDistance(
  locationsWithDistance: Array<{location: LocationEntry, distance: number}>,
  distanceThreshold?: number
): {
  name: string;
  bortleScale: number;
  distance: number;
  type?: string;
} | null {
  // Sort by distance (closest first)
  locationsWithDistance.sort((a, b) => a.distance - b.distance);

  // If locations are below a certain distance threshold, prioritize them
  if (distanceThreshold !== undefined) {
    const veryCloseLocation = locationsWithDistance.find(item => item.distance < distanceThreshold);
    if (veryCloseLocation) {
      return {
        name: veryCloseLocation.location.name,
        bortleScale: veryCloseLocation.location.bortleScale,
        distance: veryCloseLocation.distance,
        type: veryCloseLocation.location.type
      };
    }
  }
  
  // If we only have one location within radius, use it directly
  if (locationsWithDistance.length === 1) {
    const closest = locationsWithDistance[0];
    return {
      name: closest.location.name,
      bortleScale: closest.location.bortleScale,
      distance: closest.distance,
      type: closest.location.type
    };
  }
  
  // Get weighted average of Bortle scale from all locations within radius
  // Closer locations and urban types get higher weight for light pollution
  let totalWeight = 0;
  let weightedBortleSum = 0;
  
  // Use at most 3 closest locations to avoid over-smoothing
  const locationsToUse = locationsWithDistance.slice(0, 3);
  
  for (const item of locationsToUse) {
    // Base weight is inverse of distance (closer = higher weight)
    let weight = 1 / Math.max(1, item.distance);
    
    // Enhanced urban weighting for remote regions to account for concentrated light sources
    const [locLat, locLng] = item.location.coordinates;
    const isRemoteRegion = (
      (locLat > 27 && locLat < 33 && locLng > 85 && locLng < 95) || // Tibet
      (locLat > 35 && locLat < 48 && locLng > 75 && locLng < 95) || // Xinjiang
      (locLat > 38 && locLat < 46 && locLng > 105 && locLng < 125) || // Inner Mongolia
      (locLat > 40 && locLat < 50 && locLng > 120 && locLng < 135) // Northeast
    );
    
    // Give more weight to urban areas for light pollution (cities dominate nearby areas)
    if (item.location.type === 'urban') {
      // Urban areas in remote regions have even stronger influence
      weight *= isRemoteRegion ? 2.5 : 2.0;
    } else if (item.location.type === 'suburban') {
      // Suburban areas also contribute significantly to light pollution
      weight *= isRemoteRegion ? 2.0 : 1.7;
    }
    
    // Mountains and dark sites get lower weights - they block light less effectively
    // This better represents how dark these areas actually are
    if (item.location.type === 'natural' && 
        (item.location.name.toLowerCase().includes('mountain') || 
        item.location.name.toLowerCase().includes('mountains') ||
        item.location.name.toLowerCase().includes('peak') ||
        item.location.name.toLowerCase().includes('range'))) {
      weight *= 0.7; // Reduced weight for mountains to better preserve their darkness
    } else if (item.location.type === 'dark-site') {
      weight *= 0.6; // Even lower weight for designated dark sites
    }
    
    totalWeight += weight;
    weightedBortleSum += item.location.bortleScale * weight;
  }
  
  if (totalWeight > 0) {
    const calculatedBortle = weightedBortleSum / totalWeight;
    
    // Use the closest location's name but the weighted Bortle scale
    return {
      name: locationsWithDistance[0].location.name,
      bortleScale: calculatedBortle,
      distance: locationsWithDistance[0].distance,
      type: locationsWithDistance[0].location.type
    };
  }
  
  return null;
}
