
/**
 * Star analysis utilities for enhanced Bortle scale estimation
 */

// Star visibility thresholds by magnitude for each Bortle class
// Based on astronomical research data
const BORTLE_MAGNITUDE_THRESHOLDS = {
  1: 7.6, // Class 1 (Excellent dark sky): stars to magnitude 7.6-8.0 visible
  2: 7.1, // Class 2 (Typical truly dark sky): stars to magnitude 7.1-7.5 visible
  3: 6.6, // Class 3 (Rural sky): stars to magnitude 6.6-7.0 visible
  4: 6.2, // Class 4 (Rural/suburban transition): stars to magnitude 6.1-6.5 visible
  5: 5.6, // Class 5 (Suburban sky): stars to magnitude 5.6-6.0 visible
  6: 5.0, // Class 6 (Bright suburban sky): stars to magnitude 5.0-5.5 visible
  7: 4.5, // Class 7 (Suburban/urban transition): stars to magnitude 4.6-5.0 visible
  8: 4.0, // Class 8 (City sky): stars to magnitude 4.1-4.5 visible
  9: 3.5  // Class 9 (Inner city sky): stars to magnitude <4.0 visible
};

// Map visible stars count to estimated Bortle scale
// Based on statistical analysis of star visibility
export const STAR_COUNT_TO_BORTLE: { [key: string]: number } = {
  // Format: "minStars-maxStars": bortleScale
  "0-10": 9,
  "11-20": 8.5,
  "21-50": 8,
  "51-100": 7.5,
  "101-200": 7,
  "201-350": 6.5,
  "351-500": 6,
  "501-750": 5.5,
  "751-1000": 5,
  "1001-1500": 4.5,
  "1501-2000": 4,
  "2001-3000": 3.5,
  "3001-4000": 3,
  "4001-5000": 2.5,
  "5001-7000": 2,
  "7001-10000": 1.5,
  "10001+": 1
};

/**
 * Get Bortle scale estimate from star count
 * @param starCount Number of visible stars
 * @returns Estimated Bortle scale (1-9)
 */
export function getBortleScaleFromStarCount(starCount: number): number {
  if (typeof starCount !== 'number' || starCount < 0) {
    return 5; // Default to moderate light pollution for invalid counts
  }
  
  // Find the matching range in our mapping table
  for (const [range, bortleScale] of Object.entries(STAR_COUNT_TO_BORTLE)) {
    if (range === "10001+") {
      if (starCount > 10000) return bortleScale;
    } else {
      const [minStr, maxStr] = range.split('-');
      const min = parseInt(minStr, 10);
      const max = parseInt(maxStr, 10);
      
      if (starCount >= min && starCount <= max) {
        return bortleScale;
      }
    }
  }
  
  // Fallback for any uncategorized counts
  if (starCount > 5000) return 1.5;
  if (starCount > 1000) return 4;
  if (starCount > 200) return 6;
  if (starCount > 50) return 7.5;
  return 8.5;
}

/**
 * Get the limiting magnitude from a star count
 * Uses the relationship between star count and limiting magnitude
 * @param starCount Number of visible stars
 * @returns Estimated limiting magnitude
 */
export function getLimitingMagnitudeFromStarCount(starCount: number): number {
  // Formula based on astronomical research
  // For whole sky visibility (4π steradians)
  if (starCount <= 0) return 3.0;
  
  // Approximate limiting magnitude based on star count using power function
  // Derived from statistical analysis of star catalogs
  return Math.min(8.0, 2.5 + Math.log10(starCount) * 1.2);
}

/**
 * Get Bortle scale from limiting magnitude
 * @param limitingMagnitude The faintest stars visible (magnitude)
 * @returns Bortle scale (1-9)
 */
export function getBortleScaleFromLimitingMagnitude(limitingMagnitude: number): number {
  if (limitingMagnitude >= 7.5) return 1;
  if (limitingMagnitude >= 7.0) return 2;
  if (limitingMagnitude >= 6.5) return 3;
  if (limitingMagnitude >= 6.0) return 4;
  if (limitingMagnitude >= 5.5) return 5;
  if (limitingMagnitude >= 5.0) return 6;
  if (limitingMagnitude >= 4.5) return 7;
  if (limitingMagnitude >= 4.0) return 8;
  return 9;
}

// Database of locations with star count measurements
type StarCountRecord = {
  latitude: number;
  longitude: number;
  starCount: number;
  date: string;
  bortleScale: number;
};

// In a real implementation, this would be loaded from a database
// For this prototype, we're including a small sample dataset
const STAR_COUNT_DATABASE: StarCountRecord[] = [
  // Sample records - would be populated from user measurements
  { latitude: 37.7749, longitude: -122.4194, starCount: 120, date: '2023-01-15', bortleScale: 7 },
  { latitude: 40.7128, longitude: -74.0060, starCount: 90, date: '2023-02-20', bortleScale: 7.5 },
  { latitude: 34.0522, longitude: -118.2437, starCount: 150, date: '2023-03-10', bortleScale: 6.8 },
  { latitude: 29.7604, longitude: -95.3698, starCount: 200, date: '2023-01-05', bortleScale: 6.5 },
  { latitude: 41.8781, longitude: -87.6298, starCount: 100, date: '2023-02-12', bortleScale: 7.2 },
  { latitude: 47.6062, longitude: -122.3321, starCount: 180, date: '2023-03-18', bortleScale: 6.7 },
  { latitude: 39.9042, longitude: 116.4074, starCount: 70, date: '2023-01-25', bortleScale: 8 },
  { latitude: 31.2304, longitude: 121.4737, starCount: 60, date: '2023-02-28', bortleScale: 8.2 },
  { latitude: 22.3193, longitude: 114.1694, starCount: 50, date: '2023-03-22', bortleScale: 8.3 },
  { latitude: 35.6762, longitude: 139.6503, starCount: 40, date: '2023-01-30', bortleScale: 8.5 },
  { latitude: 37.5665, longitude: 126.9780, starCount: 80, date: '2023-02-15', bortleScale: 7.8 },
  { latitude: 51.5074, longitude: -0.1278, starCount: 110, date: '2023-03-05', bortleScale: 7.1 },
  { latitude: 48.8566, longitude: 2.3522, starCount: 100, date: '2023-01-10', bortleScale: 7.2 },
  { latitude: 52.5200, longitude: 13.4050, starCount: 130, date: '2023-02-25', bortleScale: 7 },
  { latitude: 45.4215, longitude: -75.6972, starCount: 230, date: '2023-03-15', bortleScale: 6.4 },
  { latitude: 36.1699, longitude: -115.1398, starCount: 90, date: '2023-01-20', bortleScale: 7.5 },
  { latitude: 33.4484, longitude: -112.0740, starCount: 170, date: '2023-02-05', bortleScale: 6.8 },
  { latitude: 37.9738, longitude: 23.7275, starCount: 140, date: '2023-03-27', bortleScale: 6.9 },
  
  // Dark sky sites
  { latitude: 19.8207, longitude: -155.4681, starCount: 4800, date: '2023-01-01', bortleScale: 2.1 }, // Mauna Kea
  { latitude: -32.3813, longitude: 20.8102, starCount: 5200, date: '2023-02-10', bortleScale: 1.9 }, // Sutherland Observatory
  { latitude: -29.2562, longitude: -70.7380, starCount: 6100, date: '2023-03-20', bortleScale: 1.5 }, // La Silla Observatory
  { latitude: 30.6797, longitude: -104.0202, starCount: 4500, date: '2023-01-08', bortleScale: 2.2 }, // McDonald Observatory
  { latitude: 32.7027, longitude: -109.8919, starCount: 3800, date: '2023-02-18', bortleScale: 2.4 }, // Mount Graham
  { latitude: 40.1489, longitude: -121.4179, starCount: 3600, date: '2023-03-12', bortleScale: 2.5 }, // Lassen National Park
  { latitude: 38.9351, longitude: -114.2582, starCount: 4200, date: '2023-01-22', bortleScale: 2.3 }, // Great Basin National Park
  { latitude: -31.2730, longitude: 149.0644, starCount: 3900, date: '2023-02-08', bortleScale: 2.4 }, // Siding Spring Observatory
];

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Find Bortle scale using star count data for a location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Bortle scale or null if no nearby data
 */
export async function getStarCountBortleScale(
  latitude: number, 
  longitude: number
): Promise<number | null> {
  try {
    // Find records within reasonable distance (50km)
    const MAX_DISTANCE = 50; // km
    const nearbyRecords = STAR_COUNT_DATABASE.filter(record => {
      const distance = calculateDistance(
        latitude, longitude, 
        record.latitude, record.longitude
      );
      return distance <= MAX_DISTANCE;
    });
    
    if (nearbyRecords.length === 0) {
      return null; // No nearby star count data
    }
    
    // If we have multiple records, use inverse distance weighting
    if (nearbyRecords.length > 1) {
      let weightedSum = 0;
      let weightSum = 0;
      
      for (const record of nearbyRecords) {
        const distance = calculateDistance(
          latitude, longitude, 
          record.latitude, record.longitude
        );
        
        // Avoid division by zero
        const weight = distance < 0.1 ? 10 : 1 / distance;
        
        weightedSum += record.bortleScale * weight;
        weightSum += weight;
      }
      
      return weightSum > 0 ? weightedSum / weightSum : null;
    }
    
    // If only one record, use its Bortle scale directly
    return nearbyRecords[0].bortleScale;
  } catch (error) {
    console.error("Error getting star count Bortle scale:", error);
    return null;
  }
}

/**
 * Add a star count record to the local database
 * In a real implementation, this would save to a database
 */
export function addStarCountRecord(
  latitude: number,
  longitude: number,
  starCount: number,
  bortleScale?: number
): void {
  try {
    // Calculate Bortle scale if not provided
    const calculatedBortleScale = bortleScale || getBortleScaleFromStarCount(starCount);
    
    // Create record
    const newRecord: StarCountRecord = {
      latitude,
      longitude,
      starCount,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      bortleScale: calculatedBortleScale
    };
    
    // In a real implementation, this would save to a database
    console.log("Star count record would be saved:", newRecord);
    
    // For this prototype, we could add to the in-memory database
    // STAR_COUNT_DATABASE.push(newRecord);
  } catch (error) {
    console.error("Error adding star count record:", error);
  }
}

/**
 * Save star count to localStorage for persistence
 */
export function saveStarCountToLocalStorage(
  latitude: number,
  longitude: number,
  locationName: string,
  starCount: number,
  bortleScale: number
): void {
  try {
    // Get existing measurements or initialize empty array
    const existingData = localStorage.getItem('starCountMeasurements');
    const measurements = existingData ? JSON.parse(existingData) : [];
    
    // Add new measurement
    measurements.push({
      latitude,
      longitude,
      locationName,
      starCount,
      bortleScale,
      timestamp: new Date().toISOString()
    });
    
    // Save back to localStorage
    localStorage.setItem('starCountMeasurements', JSON.stringify(measurements));
    console.log("Star count measurement saved to local storage");
  } catch (error) {
    console.error("Error saving star count to localStorage:", error);
  }
}
