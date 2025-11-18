
import { fetchLightPollutionData } from "@/lib/api";
import { estimateBortleScaleByLocation, findClosestKnownLocation } from "@/utils/locationUtils";
import { fuseBortleScales, gaussianProcessInterpolation, filterOutliers, BortleDataSource } from "@/utils/bortleCalculation/dataFusion";

// Default timeout for light pollution API requests (in milliseconds)
const DEFAULT_TIMEOUT = 5000;
// Default cache lifetime for Bortle scale data (in milliseconds)
const BORTLE_CACHE_LIFETIME = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Enhanced service for retrieving and calculating Bortle scale data
 * Prioritizes star count measurements, then local database, then API data
 */
export const getBortleScaleData = async (
  latitude: number,
  longitude: number,
  locationName: string,
  bortleScale: number | null,
  displayOnly: boolean,
  getCachedData: (key: string, maxAge?: number) => any,
  setCachedData: (key: string, data: any) => void,
  language: string = 'en',
  setStatusMessage?: (message: string | null) => void,
  timeout: number = DEFAULT_TIMEOUT
): Promise<number | null> => {
  console.log("Getting Bortle scale data for", latitude, longitude, locationName);
  
  // Skip processing if coordinates are invalid
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return null;
  }
  
  // If in display-only mode and a valid bortleScale is provided, use it
  if (displayOnly && bortleScale !== null && bortleScale >= 1 && bortleScale <= 9) {
    return bortleScale;
  }
  
  // Check for cached Bortle scale data first (fast response)
  const bortleCacheKey = `bortle-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  const cachedBortleData = getCachedData(bortleCacheKey, BORTLE_CACHE_LIFETIME);
  
  if (cachedBortleData?.bortleScale && 
      typeof cachedBortleData.bortleScale === 'number' &&
      cachedBortleData.bortleScale >= 1 && 
      cachedBortleData.bortleScale <= 9) {
    console.log("Using cached Bortle scale:", cachedBortleData.bortleScale, "source:", cachedBortleData.source);
    return cachedBortleData.bortleScale;
  }
  
  // Collect data from multiple sources
  const dataSources: BortleDataSource[] = [];
  
  try {
    // Source 1: Star count data (highest accuracy)
    try {
      const { getStarCountBortleScale } = await import('@/utils/starAnalysis');
      const starBortleScale = await getStarCountBortleScale(latitude, longitude);
      
      if (starBortleScale !== null) {
        console.log("Star count data available:", starBortleScale);
        dataSources.push({
          bortleScale: starBortleScale,
          confidence: 0.95,
          source: 'star_count',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.warn("Star count analysis unavailable:", error);
    }
    
    // Source 2: Terrain-corrected data
    try {
      const { getTerrainCorrectedBortleScale } = await import('@/utils/terrainCorrection');
      const terrainCorrectedScale = await getTerrainCorrectedBortleScale(latitude, longitude, locationName);
      
      if (terrainCorrectedScale !== null) {
        console.log("Terrain-corrected data available:", terrainCorrectedScale);
        dataSources.push({
          bortleScale: terrainCorrectedScale,
          confidence: 0.90,
          source: 'terrain_corrected',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.warn("Terrain correction unavailable:", error);
    }
    
    // Source 3: Database lookup
    const { findClosestLocation } = await import("@/data/locationDatabase");
    const closestLocation = findClosestLocation(latitude, longitude);
    
    if (closestLocation && typeof closestLocation.bortleScale === 'number' && 
        closestLocation.bortleScale >= 1 && closestLocation.bortleScale <= 9 && 
        closestLocation.distance < 100) {
      console.log("Database data available:", closestLocation.bortleScale);
      
      // Confidence decreases with distance
      const distanceConfidence = Math.max(0.5, 1 - (closestLocation.distance / 100));
      dataSources.push({
        bortleScale: closestLocation.bortleScale,
        confidence: 0.85 * distanceConfidence,
        source: 'database',
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error("Error using local database for Bortle scale:", error);
  }
  
  try {
    // Source 4: API light pollution data
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const lightPollutionData = await fetchLightPollutionData(
      latitude, 
      longitude
    );
    
    clearTimeout(timeoutId);
    
    if (lightPollutionData?.bortleScale !== null && 
        typeof lightPollutionData.bortleScale === 'number' && 
        lightPollutionData.bortleScale >= 1 && 
        lightPollutionData.bortleScale <= 9) {
      
      console.log("API data available:", lightPollutionData.bortleScale);
      dataSources.push({
        bortleScale: lightPollutionData.bortleScale,
        confidence: 0.70,
        source: 'api',
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
  }
  
  // Source 5: Known locations utility
  try {
    const closestKnownLocation = findClosestKnownLocation(latitude, longitude);
    if (closestKnownLocation && 
        typeof closestKnownLocation.bortleScale === 'number' && 
        closestKnownLocation.bortleScale >= 1 && 
        closestKnownLocation.bortleScale <= 9 && 
        closestKnownLocation.distance < 100) {
      
      console.log("Known location data available:", closestKnownLocation.bortleScale);
      const distanceConfidence = Math.max(0.4, 1 - (closestKnownLocation.distance / 100));
      dataSources.push({
        bortleScale: closestKnownLocation.bortleScale,
        confidence: 0.75 * distanceConfidence,
        source: 'utility',
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error("Error using fallback utility for Bortle scale:", error);
  }
  
  // Fuse multiple data sources using advanced algorithm
  if (dataSources.length > 0) {
    console.log(`Fusing ${dataSources.length} data sources:`, dataSources.map(s => `${s.source}(${s.bortleScale})`).join(', '));
    
    // Filter outliers if we have multiple sources
    const filteredSources = dataSources.length >= 3 
      ? filterOutliers(dataSources)
      : dataSources;
    
    const fusedResult = fuseBortleScales(filteredSources, {
      useTemporalDecay: true,
      minConfidence: 0.3
    });
    
    if (fusedResult) {
      console.log(`Fused Bortle scale: ${fusedResult.bortleScale} (confidence: ${fusedResult.confidence.toFixed(2)})`);
      console.log(`Sources used: ${fusedResult.sources.join(', ')}`);
      
      setCachedData(bortleCacheKey, { 
        bortleScale: fusedResult.bortleScale,
        confidence: fusedResult.confidence,
        sources: fusedResult.sources,
        source: 'fused',
        timestamp: Date.now()
      });
      
      return fusedResult.bortleScale;
    }
  }
  
  // Last resort: Use location-based estimation
  if (locationName && locationName.length > 3) {
    try {
      const estimatedScale = estimateBortleScaleByLocation(locationName, latitude, longitude);
      
      if (estimatedScale >= 1 && estimatedScale <= 9) {
        console.log("Using estimated Bortle scale:", estimatedScale);
        
        setCachedData(bortleCacheKey, { 
          bortleScale: estimatedScale, 
          estimated: true,
          source: 'estimation',
          confidence: 0.50,
          timestamp: Date.now()
        });
        
        if (!displayOnly && setStatusMessage) {
          setStatusMessage(language === 'en'
            ? "Using estimate based on location name. Upload a night sky photo for better accuracy."
            : "使用基于位置名称的估算。上传夜空照片以获得更高的准确性。");
        }
        
        return estimatedScale;
      }
    } catch (error) {
      console.error("Error estimating Bortle scale:", error);
    }
  }
  
  // If we get here, we couldn't determine the Bortle scale
  if (!displayOnly && setStatusMessage) {
    setStatusMessage(language === 'en'
      ? "Unable to determine light pollution level. Try uploading a night sky photo."
      : "无法确定光污染水平。请尝试上传夜空照片。");
  }
  
  setCachedData(bortleCacheKey, { 
    bortleScale: null, 
    unknown: true,
    source: 'unknown',
    confidence: 0,
    timestamp: Date.now()
  });
  
  return null;
};
