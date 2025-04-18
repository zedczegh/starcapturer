
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/utils/locationValidator';
import { calculateRealTimeSiqs } from './realTimeSiqs/siqsCalculator';
import { fetchLightPollutionData } from '@/lib/api/pollution';
import { getTerrainCorrectedBortleScale } from '@/utils/terrainCorrection';

// Cache generated spot data for better performance
const spotCache = new Map<string, {
  spots: SharedAstroSpot[];
  timestamp: number;
  radius: number;
}>();

// Cache duration: 15 minutes
const CACHE_DURATION = 15 * 60 * 1000;

/**
 * Enhanced location spot generator with improved accuracy
 */
export async function generateCalculatedSpots(
  latitude: number,
  longitude: number,
  radius: number,
  limit: number = 10
): Promise<SharedAstroSpot[]> {
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${radius}`;
  const cached = spotCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`Using cached spots for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    return cached.spots.slice(0, limit);
  }

  const points: SharedAstroSpot[] = [];
  const attempts = Math.min(limit * 3, 30); // Generate more points for better selection
  const batchSize = 5; // Process in small batches for better performance
  
  for (let i = 0; i < attempts; i += batchSize) {
    const batchPromises = Array(Math.min(batchSize, attempts - i))
      .fill(null)
      .map(async () => {
        try {
          return await generateSingleSpot(latitude, longitude, radius);
        } catch (error) {
          console.warn('Failed to generate spot:', error);
          return null;
        }
      });

    const batchResults = await Promise.all(batchPromises);
    points.push(...batchResults.filter((spot): spot is SharedAstroSpot => 
      spot !== null && !isWaterLocation(spot.latitude, spot.longitude)
    ));

    if (points.length >= limit) {
      break;
    }
  }

  // Sort by SIQS score and distance
  const sortedPoints = points.sort((a, b) => {
    const scoreA = typeof a.siqs === 'number' ? a.siqs : 0;
    const scoreB = typeof b.siqs === 'number' ? b.siqs : 0;
    
    // Weight SIQS more heavily than distance
    return (scoreB - scoreA) * 2 - ((a.distance || 0) - (b.distance || 0)) * 0.1;
  });

  const result = sortedPoints.slice(0, limit);
  
  // Cache the results
  spotCache.set(cacheKey, {
    spots: result,
    timestamp: Date.now(),
    radius
  });

  return result;
}

async function generateSingleSpot(
  centerLat: number, 
  centerLng: number, 
  radius: number
): Promise<SharedAstroSpot | null> {
  // Generate random angle and distance within radius
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.sqrt(Math.random()) * radius; // Square root for better distribution
  
  // Convert to coordinates
  const lat = centerLat + (distance / 111.32) * Math.cos(angle);
  const lng = centerLng + (distance / (111.32 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
  
  try {
    // Get terrain-corrected Bortle scale
    const bortleScale = await getTerrainCorrectedBortleScale(lat, lng) || 4;
    
    // Get light pollution data if available
    const pollutionData = await fetchLightPollutionData(lat, lng)
      .catch(() => ({ bortleScale }));
    
    // Calculate SIQS with latest data
    const siqsResult = await calculateRealTimeSiqs(lat, lng, pollutionData.bortleScale);
    
    if (!siqsResult || siqsResult.siqs < 3) {
      return null;
    }
    
    return {
      id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Calculated Location',
      latitude: lat,
      longitude: lng,
      bortleScale: pollutionData.bortleScale,
      siqs: siqsResult.siqs * 10,
      isViable: true,
      distance: distance,
      timestamp: new Date().toISOString(),
      siqsResult: {
        score: siqsResult.siqs,
        isViable: true,
        factors: siqsResult.factors
      }
    };
  } catch (error) {
    console.warn('Error generating spot:', error);
    return null;
  }
}

// Clean cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of spotCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      spotCache.delete(key);
    }
  }
}, CACHE_DURATION);
