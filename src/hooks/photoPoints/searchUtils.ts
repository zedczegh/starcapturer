
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { haversineDistance } from '@/utils/geoUtils';

/**
 * Get SIQS value safely from location
 */
function getSafeScore(location: SharedAstroSpot): number {
  // Handle different formats of SIQS scores
  if (typeof location.siqsResult?.score === 'number') {
    return location.siqsResult.score;
  }
  
  if (typeof location.siqsResult?.siqs === 'number') {
    return location.siqsResult.siqs;
  }
  
  if (typeof location.siqs === 'number') {
    return location.siqs;
  }
  
  // For certified locations with no score, use a good default
  if (location.certification || location.isDarkSkyReserve) {
    return 7.5;
  }
  
  return 0; // Default for unknown scores
}

/**
 * Filter locations by certification status
 */
export function filterCertifiedLocations(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return locations.filter(location => 
    location.certification || location.isDarkSkyReserve);
}

/**
 * Filter locations by quality (SIQS score)
 */
export function filterLocationsByQuality(
  locations: SharedAstroSpot[], 
  minScore: number = 5
): SharedAstroSpot[] {
  return locations.filter(location => {
    const score = getSafeScore(location);
    return score > minScore;
  });
}

/**
 * Filter locations by distance from a center point
 */
export function filterLocationsByDistance(
  locations: SharedAstroSpot[], 
  centerLat: number, 
  centerLng: number, 
  maxDistanceKm: number
): SharedAstroSpot[] {
  return locations.filter(location => {
    const distance = haversineDistance(
      centerLat, 
      centerLng, 
      location.latitude, 
      location.longitude
    );
    
    return distance <= maxDistanceKm;
  });
}

/**
 * Sort locations by quality
 */
export function sortLocationsByQuality(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    const scoreA = getSafeScore(a);
    const scoreB = getSafeScore(b);
    
    return scoreB - scoreA; // Sort by highest score first
  });
}

/**
 * Sort locations by distance from a center point
 */
export function sortLocationsByDistance(
  locations: SharedAstroSpot[], 
  centerLat: number, 
  centerLng: number
): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    const distanceA = haversineDistance(
      centerLat, 
      centerLng, 
      a.latitude, 
      a.longitude
    );
    
    const distanceB = haversineDistance(
      centerLat, 
      centerLng, 
      b.latitude, 
      b.longitude
    );
    
    return distanceA - distanceB; // Sort by closest first
  });
}

/**
 * Filter locations by search query
 */
export function filterLocationsBySearch(
  locations: SharedAstroSpot[], 
  searchQuery: string
): SharedAstroSpot[] {
  if (!searchQuery || searchQuery.trim() === '') {
    return locations;
  }
  
  const query = searchQuery.toLowerCase().trim();
  
  return locations.filter(location => {
    const name = location.name?.toLowerCase() || '';
    const chineseName = location.chineseName?.toLowerCase() || '';
    const certification = location.certification?.toLowerCase() || '';
    
    return (
      name.includes(query) || 
      chineseName.includes(query) || 
      certification.includes(query)
    );
  });
}

/**
 * Categorize locations by quality
 */
export function categorizeLocationsByQuality(locations: SharedAstroSpot[]): {
  excellent: SharedAstroSpot[];
  good: SharedAstroSpot[];
  fair: SharedAstroSpot[];
  poor: SharedAstroSpot[];
} {
  const excellent: SharedAstroSpot[] = [];
  const good: SharedAstroSpot[] = [];
  const fair: SharedAstroSpot[] = [];
  const poor: SharedAstroSpot[] = [];
  
  locations.forEach(location => {
    const score = getSafeScore(location);
    
    if (score >= 8.0) {
      excellent.push(location);
    } else if (score >= 6.5) {
      good.push(location);
    } else if (score >= 5.0) {
      fair.push(location);
    } else {
      poor.push(location);
    }
  });
  
  return { excellent, good, fair, poor };
}
