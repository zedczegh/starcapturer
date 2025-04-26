
/**
 * Star Analysis Utilities
 * 
 * Methods for analyzing star visibility and estimating Bortle scale
 * based on visible star counts.
 */

// Cache for star count derived Bortle scales
const starCountCache = new Map<string, {
  bortleScale: number;
  confidence: number;
  timestamp: number;
}>();

/**
 * Get Bortle scale derived from star count data
 * This is generally the most accurate method of determining
 * true sky quality when observations are available
 */
export async function getStarCountBortleScale(
  latitude: number, 
  longitude: number,
  radius: number = 20 // km
): Promise<number | null> {
  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)},${radius}`;
  
  // Check cache first
  const cached = starCountCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 90 * 24 * 60 * 60 * 1000) {
    // 90 days cache for star observations
    return cached.bortleScale;
  }
  
  try {
    // In a real implementation, this would query a database of star observations
    // For this example, we'll generate a random value
    
    // This would normally come from a database query
    const nearbyObservations = simulateStarObservations(latitude, longitude, radius);
    
    if (nearbyObservations.length === 0) {
      return null; // No data available
    }
    
    // Calculate average Bortle scale from observations
    let totalWeight = 0;
    let weightedSum = 0;
    
    nearbyObservations.forEach(obs => {
      // Newer observations and closer ones get higher weight
      const ageInDays = (Date.now() - obs.timestamp) / (1000 * 60 * 60 * 24);
      const ageWeight = Math.max(0.5, Math.min(1, (365 - ageInDays) / 365));
      
      const distanceWeight = 1 - (obs.distanceKm / radius);
      
      // Combined weight factors
      const weight = obs.reliability * ageWeight * distanceWeight;
      
      totalWeight += weight;
      weightedSum += obs.bortleScale * weight;
    });
    
    if (totalWeight === 0) return null;
    
    const avgBortleScale = weightedSum / totalWeight;
    const bortleScale = Math.round(avgBortleScale * 10) / 10; // Round to 1 decimal place
    
    // Calculate confidence based on number of observations and recency
    const confidence = Math.min(
      0.95, 
      0.6 + (Math.min(nearbyObservations.length, 10) / 20) +
            (nearbyObservations.some(o => o.timestamp > Date.now() - 30 * 24 * 60 * 60 * 1000) ? 0.2 : 0)
    );
    
    // Cache result
    starCountCache.set(cacheKey, {
      bortleScale,
      confidence,
      timestamp: Date.now()
    });
    
    return bortleScale;
  } catch (error) {
    console.error("Error getting star count Bortle scale:", error);
    return null;
  }
}

// Simulates what would normally be a database query
function simulateStarObservations(latitude: number, longitude: number, radiusKm: number) {
  // For demonstration purposes only, this would normally query a database
  // Random number of observations, 0-5
  const numObservations = Math.floor(Math.random() * 6);
  
  // No observations 60% of the time (sparse data is realistic)
  if (Math.random() < 0.6) return [];
  
  const observations = [];
  
  for (let i = 0; i < numObservations; i++) {
    observations.push({
      bortleScale: 3 + Math.random() * 3, // Random Bortle scale between 3-6
      reliability: 0.7 + Math.random() * 0.3, // Reliability score 0.7-1.0
      distanceKm: Math.random() * radiusKm, // Random distance within radius
      timestamp: Date.now() - (Math.random() * 365 * 24 * 60 * 60 * 1000) // Random age up to 1 year
    });
  }
  
  return observations;
}

/**
 * Convert limiting magnitude to Bortle scale
 * @param limitingMagnitude The faintest star visible to the naked eye
 * @returns Approximate Bortle scale
 */
export function limitingMagnitudeToBortle(limitingMagnitude: number): number {
  if (limitingMagnitude >= 7.6) return 1;
  if (limitingMagnitude >= 7.1) return 2;
  if (limitingMagnitude >= 6.6) return 3;
  if (limitingMagnitude >= 6.1) return 4;
  if (limitingMagnitude >= 5.6) return 5;
  if (limitingMagnitude >= 5.1) return 6;
  if (limitingMagnitude >= 4.6) return 7;
  if (limitingMagnitude >= 4.1) return 8;
  return 9;
}

/**
 * Convert visible star count in Little Dipper to Bortle scale
 * @param starCount Number of stars visible in Little Dipper
 * @returns Approximate Bortle scale
 */
export function littleDipperToBortle(starCount: number): number {
  if (starCount >= 7) return 1; // All 7 stars visible
  if (starCount >= 6) return 2;
  if (starCount >= 5) return 3;
  if (starCount >= 4) return 4;
  if (starCount >= 3) return 5;
  if (starCount >= 2) return 6;
  if (starCount >= 1) return 7; // Only Polaris visible
  return 8; // None visible
}
