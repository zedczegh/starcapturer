
/**
 * Star analysis utilities
 * 
 * Specialized tools for analyzing stargazing conditions based on 
 * star counts, visibility indices, and other astronomical factors
 */

// Cache for star count data
const starCountCache = new Map<string, {
  bortleScale: number;
  timestamp: number;
}>();

// Cache TTL in milliseconds
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Derive Bortle scale from star count
 * More stars visible = lower Bortle scale (less light pollution)
 * 
 * @param starCount Number of stars visible to naked eye
 * @returns Estimated Bortle scale
 */
export function deriveBortleFromStarCount(starCount: number): number {
  // Reference values from astronomical observations
  if (starCount > 2500) return 1;       // Class 1: Excellent dark sky
  if (starCount > 1500) return 2;       // Class 2: Typical truly dark sky
  if (starCount > 800) return 3;        // Class 3: Rural sky
  if (starCount > 400) return 4;        // Class 4: Rural/suburban transition
  if (starCount > 200) return 5;        // Class 5: Suburban sky
  if (starCount > 100) return 6;        // Class 6: Bright suburban sky
  if (starCount > 50) return 7;         // Class 7: Suburban/urban transition
  if (starCount > 20) return 8;         // Class 8: City sky
  return 9;                             // Class 9: Inner city sky
}

/**
 * Get the Bortle scale based on star count data for a location
 * 
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Bortle scale if star count data available, null otherwise
 */
export async function getStarCountBortleScale(
  latitude: number,
  longitude: number
): Promise<number | null> {
  try {
    // Create cache key
    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    
    // Check cache first
    const cached = starCountCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.bortleScale;
    }
    
    // In a real implementation, this would fetch data from an API
    // For now, simulate based on location
    
    // 70% chance of having no star count data for this location
    if (Math.random() > 0.3) {
      return null;
    }
    
    // Simulate star count based on location
    // Higher latitudes and more remote areas tend to have better viewing conditions
    const latitudeFactor = Math.abs(latitude) / 90; // 0 at equator, 1 at poles
    const remoteness = Math.random(); // 0-1 simulates how remote the area is
    
    // Calculate simulated star count
    // Base of 100 stars (poor viewing), up to 3000 stars (excellent dark sky)
    const starCount = Math.round(
      100 + (latitudeFactor * 1000) + (remoteness * 1900)
    );
    
    // Convert to Bortle scale
    const bortleScale = deriveBortleFromStarCount(starCount);
    
    // Cache the result
    starCountCache.set(cacheKey, {
      bortleScale,
      timestamp: Date.now()
    });
    
    return bortleScale;
  } catch (error) {
    console.error("Error getting star count Bortle scale:", error);
    return null;
  }
}

/**
 * Clear the star count cache
 */
export function clearStarCountCache(): void {
  starCountCache.clear();
}

/**
 * Get the limiting magnitude (faintest stars visible) for a location
 * 
 * @param bortleScale Bortle scale value
 * @returns Limiting magnitude
 */
export function getLimitingMagnitude(bortleScale: number): number {
  // Approximate relationship between Bortle scale and limiting magnitude
  // Bortle 1 → ~7.5-8.0 mag, Bortle 9 → ~3.0-4.0 mag
  const magnitudes = [
    8.0,  // Bortle 1
    7.5,  // Bortle 2
    7.0,  // Bortle 3
    6.2,  // Bortle 4
    5.5,  // Bortle 5
    5.0,  // Bortle 6
    4.5,  // Bortle 7
    4.0,  // Bortle 8
    3.5   // Bortle 9
  ];
  
  // Ensure valid Bortle scale
  const index = Math.max(0, Math.min(8, Math.round(bortleScale) - 1));
  
  return magnitudes[index];
}

/**
 * Estimate number of visible astronomical objects based on Bortle scale
 * 
 * @param bortleScale Bortle scale value
 * @returns Object with counts of visible astronomical objects
 */
export function estimateVisibleObjects(bortleScale: number): {
  stars: number;
  messierObjects: number;
  galaxies: number;
  nebulae: number;
} {
  // These are estimates for naked eye viewing
  // For telescopes, the numbers would be much higher
  
  // Stars (exponential decrease with increasing Bortle)
  const stars = Math.round(6000 * Math.exp(-0.6 * bortleScale));
  
  // Messier Objects (total of 110)
  let messierObjects = 0;
  if (bortleScale <= 3) messierObjects = 90; // Dark skies
  else if (bortleScale <= 5) messierObjects = 50; // Suburban
  else if (bortleScale <= 7) messierObjects = 20; // Bright suburban
  else messierObjects = 5; // Urban
  
  // Galaxies and nebulae follow similar patterns
  const galaxies = Math.round(messierObjects * 0.4);
  const nebulae = Math.round(messierObjects * 0.3);
  
  return {
    stars,
    messierObjects,
    galaxies,
    nebulae
  };
}
