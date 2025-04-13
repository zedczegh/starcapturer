
import { calculateSIQS } from "@/lib/calculateSIQS";
import { calculateNighttimeSIQS } from "@/utils/nighttimeSIQS";
import { extractNightForecasts, calculateAverageCloudCover, formatNighttimeHoursRange } from "@/components/forecast/NightForecastUtils";
import { fetchClearSkyRate } from "@/lib/api/clearSkyRate";

// Define SIQS score cache with expiration
const siqsScoreCache = new Map<string, { score: number, timestamp: number }>();
const SIQS_CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

/**
 * Ensure SIQS value is always on a 0-10 scale
 * Optimized for better precision
 */
export const normalizeScore = (score: number): number => {
  if (score < 0) return 0;
  if (score <= 10) return Math.max(0, Math.min(10, score)); // Ensure it's within 0-10 range
  return Math.round((score / 10) * 10) / 10; // Round to 1 decimal place if it's over 10
};

/**
 * Get cached SIQS score if available
 * Added safety checks for undefined values
 */
export function getCachedSIQSScore(
  lat: number | undefined,
  lng: number | undefined,
  bortleScale: number,
  moonPhase: number
): number | null {
  // Safety check - return null if coordinates are invalid
  if (lat === undefined || lng === undefined || !isFinite(lat) || !isFinite(lng)) {
    console.log("Invalid coordinates in getCachedSIQSScore", { lat, lng });
    return null;
  }
  
  const key = `${lat.toFixed(4)}-${lng.toFixed(4)}-${bortleScale}-${moonPhase.toFixed(2)}`;
  const cached = siqsScoreCache.get(key);
  
  if (cached && (Date.now() - cached.timestamp < SIQS_CACHE_EXPIRY)) {
    console.log(`Using cached SIQS score: ${cached.score}`);
    return cached.score;
  }
  
  return null;
}

/**
 * Cache SIQS score for future use
 * Added safety checks for undefined values
 */
export function cacheSIQSScore(
  lat: number | undefined,
  lng: number | undefined,
  bortleScale: number,
  moonPhase: number,
  score: number
): void {
  // Safety check - don't cache with invalid coordinates
  if (lat === undefined || lng === undefined || !isFinite(lat) || !isFinite(lng)) {
    console.log("Invalid coordinates in cacheSIQSScore, not caching", { lat, lng });
    return;
  }
  
  const key = `${lat.toFixed(4)}-${lng.toFixed(4)}-${bortleScale}-${moonPhase.toFixed(2)}`;
  siqsScoreCache.set(key, {
    score,
    timestamp: Date.now()
  });
}

/**
 * Optimized function to calculate SIQS with weather data
 * Now includes clear sky rate as a factor (10% weight)
 * Added additional validation for coordinates
 */
export async function calculateSIQSWithWeatherData(
  weatherData: any,
  bortleScale: number,
  seeingConditions: number,
  moonPhase: number,
  forecastData: any | null
): Promise<any> {
  // Validate weather data and coordinates
  if (!weatherData || weatherData.latitude === undefined || weatherData.longitude === undefined) {
    console.error("Invalid weather data in calculateSIQSWithWeatherData", { weatherData });
    return {
      score: 0,
      isViable: false,
      factors: [{ name: "Error", score: 0, description: "Invalid weather data" }]
    };
  }
  
  // Check cache first for quick response
  const cachedScore = getCachedSIQSScore(
    weatherData.latitude,
    weatherData.longitude,
    bortleScale,
    moonPhase
  );
  
  if (cachedScore !== null) {
    return {
      score: cachedScore,
      factors: [] // Return empty factors for cached score
    };
  }

  // First try to fetch clear sky rate data if not already provided
  let clearSkyRate: number | undefined = weatherData.clearSkyRate;
  
  if (clearSkyRate === undefined && weatherData.latitude && weatherData.longitude) {
    try {
      const clearSkyData = await fetchClearSkyRate(weatherData.latitude, weatherData.longitude);
      if (clearSkyData && typeof clearSkyData.annualRate === 'number') {
        clearSkyRate = clearSkyData.annualRate;
        console.log(`Retrieved clear sky rate for location: ${clearSkyRate}%`);
      }
    } catch (error) {
      console.error("Error fetching clear sky rate:", error);
    }
  }

  // First try to calculate SIQS using nighttime forecast data
  if (forecastData && forecastData.hourly) {
    try {
      const locationWithWeather = {
        weatherData: {
          ...weatherData,
          clearSkyRate
        },
        bortleScale,
        seeingConditions,
        moonPhase
      };
      
      const nighttimeSIQS = calculateNighttimeSIQS(locationWithWeather, forecastData, null);
      if (nighttimeSIQS) {
        console.log("Using nighttime forecast for SIQS calculation:", nighttimeSIQS.score);
        
        // Make sure score is never exaggerated
        if (nighttimeSIQS.score > 8.5) {
          nighttimeSIQS.score = 8.5; // Cap at 8.5 to avoid over-promising
        }
        
        // Cache the score for future use
        cacheSIQSScore(
          weatherData.latitude,
          weatherData.longitude,
          bortleScale,
          moonPhase,
          nighttimeSIQS.score
        );
        
        return nighttimeSIQS;
      }
    } catch (error) {
      console.error("Error calculating nighttime SIQS:", error);
    }
  }
  
  // Fall back to standard calculation if nighttime calculation failed
  console.log("Falling back to standard SIQS calculation");
  const result = calculateSIQS({
    cloudCover: weatherData.cloudCover,
    bortleScale,
    seeingConditions,
    windSpeed: weatherData.windSpeed,
    humidity: weatherData.humidity,
    moonPhase,
    precipitation: weatherData.precipitation,
    weatherCondition: weatherData.weatherCondition,
    aqi: weatherData.aqi,
    clearSkyRate
  });
  
  // Cap standard result score too
  if (result.score > 8.5) {
    result.score = 8.5;
  }
  
  // Cache the score for future use
  cacheSIQSScore(
    weatherData.latitude,
    weatherData.longitude,
    bortleScale,
    moonPhase,
    result.score
  );
  
  // If we have hourly forecast data, extract nighttime info for the cloud cover factor
  if (forecastData && forecastData.hourly) {
    try {
      // Extract nighttime forecasts
      const nightForecasts = extractNightForecasts(forecastData.hourly);
      
      if (nightForecasts.length > 0) {
        // Calculate average cloud cover
        const avgNightCloudCover = calculateAverageCloudCover(nightForecasts);
        
        // Add nighttime data to the cloud cover factor
        result.factors = result.factors.map((factor: any) => {
          if (factor.name === "Cloud Cover") {
            return {
              ...factor,
              nighttimeData: {
                average: avgNightCloudCover,
                timeRange: formatNighttimeHoursRange()
              }
            };
          }
          return factor;
        });
      }
    } catch (error) {
      console.error("Error adding nighttime data to factors:", error);
    }
  }
  
  // Add Clear Sky Rate factor if it's available but not already in factors
  if (clearSkyRate !== undefined && !result.factors.some((f: any) => f.name === "Clear Sky Rate")) {
    const clearSkyFactor = {
      name: "Clear Sky Rate",
      score: Math.min(10, clearSkyRate / 10), 
      description: `Annual clear sky rate (${clearSkyRate}%), favorable for astrophotography`
    };
    
    result.factors.push(clearSkyFactor);
    
    // Adjust overall score to include clear sky rate (10% weight)
    const clearSkyScoreContribution = (clearSkyRate / 100) * 10 * 0.1;
    result.score = Math.min(10, result.score * 0.9 + clearSkyScoreContribution);
    console.log(`Added clear sky rate (${clearSkyRate}%) to SIQS calculation, adjusted score: ${result.score.toFixed(2)}`);
  }
  
  return result;
}

/**
 * Clear expired cache entries
 */
export function clearSIQSScoreCache(maxAge = SIQS_CACHE_EXPIRY): void {
  const now = Date.now();
  let count = 0;
  
  for (const [key, value] of siqsScoreCache.entries()) {
    if (now - value.timestamp > maxAge) {
      siqsScoreCache.delete(key);
      count++;
    }
  }
  
  if (count > 0) {
    console.log(`Cleared ${count} expired SIQS score cache entries`);
  }
}

/**
 * Get descriptive text for SIQS value
 */
export function getSIQSDescription(value: number): string {
  if (value >= 8) return "Excellent";
  if (value >= 6) return "Good";  
  if (value >= 5) return "Above Average";
  if (value >= 4) return "Average";
  if (value >= 2) return "Poor";
  return "Bad";
}

/**
 * Get translated SIQS description
 */
export function getTranslatedSIQSDescription(value: number, language: 'en' | 'zh' = 'en'): string {
  if (language === 'en') {
    return getSIQSDescription(value);
  }
  
  // Chinese translations
  if (value >= 8) return "极佳";
  if (value >= 6) return "良好";  
  if (value >= 5) return "较好";
  if (value >= 4) return "一般";
  if (value >= 2) return "较差";
  return "糟糕";
}

/**
 * Get CSS color class for SIQS value
 */
export function getSIQSColorClass(value: number): string {
  if (value >= 8) return "bg-green-500/80 border-green-400/50";
  if (value >= 6) return "bg-blue-500/80 border-blue-400/50";
  if (value >= 5) return "bg-olive-500/80 border-olive-400/50"; // Olive for scores over 5
  if (value >= 4) return "bg-yellow-500/80 border-yellow-400/50";
  if (value >= 2) return "bg-orange-500/80 border-orange-400/50";
  return "bg-red-500/80 border-red-400/50";
}

/**
 * Determine if viewing conditions are good for astrophotography
 */
export function isGoodViewingCondition(value: number): boolean {
  return value >= 5.0; // Threshold is 5.0
}

/**
 * Format SIQS value for display with consistent decimal places
 */
export function formatSIQSScoreForDisplay(value: number): string {
  // Handle undefined or null
  if (value === undefined || value === null) return "0.0";
  
  // Always show one decimal place
  return value.toFixed(1);
}
