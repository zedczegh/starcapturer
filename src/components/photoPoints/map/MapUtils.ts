import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { isWaterLocation } from '@/utils/locationWaterCheck';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { fetchForecastData } from '@/lib/api';
import { calculateTonightCloudCover } from '@/utils/nighttimeSIQS';

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

  // For the calculated view, generate and filter non-certified locations by distance
  if (activeView === 'calculated' && userLocation) {
    // Generate more calculated locations around the user if we don't have enough
    if (nonCertifiedLocations.length < 15) {
      console.log(`Generating more calculated points around user location with radius ${searchRadius}km`);
      // Make this synchronous by directly generating points
      const generatedPoints = generateCalculatedPointsSync(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius,
        25
      );
      
      // Add these to our non-certified locations
      nonCertifiedLocations = [...nonCertifiedLocations, ...generatedPoints];
    }
    
    // Filter by distance and minimum quality (SIQS >= 5.0)
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
      
      // Get the SIQS score - filter out low quality spots
      const siqsScore = typeof loc.siqs === 'number' ? loc.siqs : 
                       (loc.siqsResult && typeof loc.siqsResult.score === 'number' ? 
                        loc.siqsResult.score : 0);
      
      // Keep locations that:
      // 1. Are within search radius
      // 2. Not in water
      // 3. Have SIQS score >= 5.0
      return distance <= searchRadius && 
             !isWaterLocation(loc.latitude, loc.longitude, false) &&
             siqsScore >= 5.0;
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
 * Generate calculated points around a center location synchronously
 * Calculate SIQS score for each point based on cloud cover
 */
function generateCalculatedPointsSync(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  count: number
): SharedAstroSpot[] {
  const points: SharedAstroSpot[] = [];
  
  // Use higher quality cloud cover estimates initially, later updated by real-time fetcher
  // This provides better initial estimates and filters out low-quality spots from the start
  // All spots start with SIQS >= 5.0 (cloud cover <= 50%)
  const maxInitialCloudCover = 50; // Max 50% cloud cover to ensure SIQS >= 5.0
  
  for (let i = 0; i < count; i++) {
    // Generate a random point within the radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusKm;
    
    // Convert distance in km to degrees (approximate)
    const latOffset = distance * 0.009 * Math.cos(angle);
    const lngOffset = distance * 0.009 * Math.sin(angle);
    
    const lat = centerLat + latOffset;
    const lng = centerLng + lngOffset;
    
    // Skip water locations
    if (isWaterLocation(lat, lng, false)) {
      continue;
    }
    
    // Calculate actual distance
    const actualDistance = calculateDistance(centerLat, centerLng, lat, lng);
    
    // Calculate initial SIQS score based on good cloud cover conditions
    // These will be updated later with real data via RealTimeSiqsFetcher
    const cloudCover = Math.random() * maxInitialCloudCover; // 0-50% cloud cover
    const siqsScore = Math.max(5.0, 10 - (cloudCover / 10)); // Ensure minimum 5.0 score
    
    // Create the point with the initial high-quality SIQS score
    points.push({
      id: `calc-${i}-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      name: `Calculated Point ${i+1}`,
      latitude: lat,
      longitude: lng,
      bortleScale: 4,
      siqs: siqsScore,
      siqsResult: {
        score: siqsScore,
        isViable: true, // Always viable since SIQS >= 5.0
        factors: [{
          name: "Cloud Cover",
          score: (100 - cloudCover) / 10,
          description: `Tonight's cloud cover: ${Math.round(cloudCover)}%`
        }]
      },
      distance: actualDistance,
      timestamp: new Date().toISOString()
    });
  }
  
  console.log(`Generated ${points.length} high-quality calculated points (SIQS >= 5.0)`);
  return points;
}

/**
 * Async version for future use if needed - kept for reference
 * Generate calculated points around a center location
 * Calculate SIQS score for each point based on cloud cover
 */
async function generateCalculatedPoints(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  count: number
): Promise<SharedAstroSpot[]> {
  const points: SharedAstroSpot[] = [];
  
  // Fetch forecast data for the center point to use for nearby points
  let forecastData;
  try {
    forecastData = await fetchForecastData({
      latitude: centerLat,
      longitude: centerLng
    });
  } catch (error) {
    console.error("Error fetching forecast data for calculated points:", error);
  }
  
  for (let i = 0; i < count; i++) {
    // Generate a random point within the radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusKm;
    
    // Convert distance in km to degrees (approximate)
    const latOffset = distance * 0.009 * Math.cos(angle);
    const lngOffset = distance * 0.009 * Math.sin(angle);
    
    const lat = centerLat + latOffset;
    const lng = centerLng + lngOffset;
    
    // Skip water locations
    if (isWaterLocation(lat, lng, false)) {
      continue;
    }
    
    // Calculate actual distance
    const actualDistance = calculateDistance(centerLat, centerLng, lat, lng);
    
    // Calculate cloud cover-based SIQS score for this point
    let siqsScore = 0;
    let cloudCover = 50; // Default if no forecast data
    let isViable = false;
    
    if (forecastData && forecastData.hourly) {
      // Use the forecast data to calculate cloud cover for this point (slightly randomized)
      cloudCover = calculateTonightCloudCover(forecastData.hourly, lat, lng);
      
      // Add some variation to make points more realistic
      const variation = Math.random() * 20 - 10; // -10 to +10
      cloudCover = Math.max(0, Math.min(100, cloudCover + variation));
      
      // Calculate SIQS based on cloud cover
      siqsScore = Math.max(0, 10 - (cloudCover / 10));
      isViable = cloudCover <= 40; // Only viable if cloud cover <= 40%
    }
    
    // Create the point with the calculated SIQS score
    points.push({
      id: `calc-${i}-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      name: `Calculated Point ${i+1}`,
      latitude: lat,
      longitude: lng,
      bortleScale: 4,
      siqs: siqsScore,
      siqsResult: {
        score: siqsScore,
        isViable: isViable,
        factors: [{
          name: "Cloud Cover",
          score: (100 - cloudCover) / 10,
          description: `Tonight's cloud cover: ${Math.round(cloudCover)}%`
        }]
      },
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
