
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { isWaterLocation } from '@/utils/locationWaterCheck';

/**
 * Filter locations based on various criteria
 */
export const filterLocations = (
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] => {
  // Basic validation
  if (!locations || locations.length === 0) {
    return [];
  }

  // First separate certified and non-certified locations
  const certifiedLocations = locations.filter(
    loc => loc.isDarkSkyReserve || loc.certification
  );
  
  let nonCertifiedLocations = locations.filter(
    loc => !loc.isDarkSkyReserve && !loc.certification
  );

  // For the calculated view, filter non-certified locations by distance
  if (activeView === 'calculated' && userLocation) {
    // Generate more calculated locations around the user if we don't have enough
    if (nonCertifiedLocations.length < 20) {
      const generatedPoints = generateCalculatedPoints(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius,
        30 // Generate more points
      );
      
      // Add these to our non-certified locations
      nonCertifiedLocations = [...nonCertifiedLocations, ...generatedPoints];
    }
    
    // Filter by distance
    nonCertifiedLocations = nonCertifiedLocations.filter(loc => {
      // Skip invalid locations
      if (!loc.latitude || !loc.longitude) return false;
      
      // Calculate distance from user
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        loc.latitude,
        loc.longitude
      );
      
      // Keep locations within search radius that aren't in water
      return distance <= searchRadius && !isWaterLocation(loc.latitude, loc.longitude, false);
    });
  }

  // For certified view, only return certified locations
  if (activeView === 'certified') {
    return certifiedLocations;
  }
  
  // For calculated view, return both filtered non-certified and all certified
  return [...certifiedLocations, ...nonCertifiedLocations];
};

/**
 * Generate calculated points around a center location
 */
function generateCalculatedPoints(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  count: number
): SharedAstroSpot[] {
  const points: SharedAstroSpot[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate a random point within the radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusKm;
    
    // Convert distance in km to degrees (approximate)
    const latOffset = distance * 0.009 * Math.cos(angle);
    const lngOffset = distance * 0.009 * Math.sin(angle);
    
    const lat = centerLat + latOffset;
    const lng = centerLng + lngOffset;
    
    // Calculate actual distance
    const actualDistance = calculateDistance(centerLat, centerLng, lat, lng);
    
    // Generate a simple SIQS score (6-9 range)
    const siqsScore = 6 + Math.random() * 3;
    
    points.push({
      id: `calc-${i}-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      name: `Calculated Point ${i+1}`,
      latitude: lat,
      longitude: lng,
      bortleScale: 4,
      siqs: { score: siqsScore, isViable: true },
      distance: actualDistance,
      timestamp: new Date().toISOString()
    });
  }
  
  return points;
}

/**
 * Optimize locations for mobile display
 */
export const optimizeLocationsForMobile = (
  locations: SharedAstroSpot[],
  isMobile: boolean,
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] => {
  if (!isMobile || locations.length <= 30) {
    return locations;
  }

  // Always keep certified locations
  const certified = locations.filter(loc => 
    loc.isDarkSkyReserve || loc.certification
  );
  
  // Reduce the number of non-certified locations on mobile
  const nonCertified = locations
    .filter(loc => !loc.isDarkSkyReserve && !loc.certification)
    .filter((_, index) => index % (activeView === 'certified' ? 4 : 2) === 0)
    .slice(0, 50); // Hard limit for better performance
  
  return [...certified, ...nonCertified];
};
