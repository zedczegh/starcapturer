
import { calculateSIQS } from "@/lib/calculateSIQS";
import { fetchWeatherData } from "@/lib/api";
import { SharedAstroSpot } from "@/types/weather";
import { SIQSFactors } from "@/lib/siqs/types";

/**
 * Calculate SIQS score for a location with fallback values when needed
 */
export const calculateSiqsForLocation = async (
  latitude: number,
  longitude: number,
  bortleScale: number,
  language: string = 'en'
): Promise<{ 
  score: number;
  isViable: boolean;
  factors: Array<{ name: string; score: number; description: string }>;
}> => {
  try {
    // Fetch current weather data
    const weatherData = await fetchWeatherData({ latitude, longitude });
    
    if (!weatherData) {
      console.warn("Weather data unavailable, using default values");
      return getDefaultSiqsResult(bortleScale, language);
    }
    
    // Calculate SIQS with available weather data
    const result = calculateSIQS({
      cloudCover: weatherData.cloudCover,
      bortleScale: bortleScale || 5,
      seeingConditions: 3, // Default to average
      windSpeed: weatherData.windSpeed,
      humidity: weatherData.humidity,
      moonPhase: 0.5, // Default to average
      precipitation: weatherData.precipitation,
      aqi: weatherData.aqi
    });
    
    return result;
  } catch (error) {
    console.error("Error calculating SIQS:", error);
    return getDefaultSiqsResult(bortleScale, language);
  }
};

/**
 * Get default SIQS result when data is unavailable
 */
function getDefaultSiqsResult(
  bortleScale: number,
  language: string
): { 
  score: number;
  isViable: boolean;
  factors: Array<{ name: string; score: number; description: string }>;
} {
  const defaultScore = bortleScale < 5 ? 6 : 4;
  
  return {
    score: defaultScore,
    isViable: defaultScore >= 3,
    factors: [
      {
        name: language === 'en' ? 'Bortle Scale' : '波特尔等级',
        score: ((9 - bortleScale) * 11.11), // Convert 1-9 scale to 0-100
        description: language === 'en' 
          ? `Bortle scale ${bortleScale} affects sky darkness` 
          : `波特尔等级 ${bortleScale} 影响天空黑暗度`
      },
      {
        name: language === 'en' ? 'Weather Conditions' : '天气状况',
        score: 70,
        description: language === 'en'
          ? 'Using default weather conditions'
          : '使用默认天气状况'
      }
    ]
  };
}

/**
 * Calculate SIQS for a shared astro spot with fallback values
 */
export const calculateSpotSIQS = (
  spot: SharedAstroSpot,
  language: string = 'en'
): number => {
  try {
    // If spot already has SIQS score, use it
    if (typeof spot.siqs === 'number') {
      return spot.siqs;
    }
    
    if (spot.siqs && typeof spot.siqs === 'object' && typeof spot.siqs.score === 'number') {
      return spot.siqs.score;
    }
    
    // Use what data we have with defaults for missing values
    const factors: SIQSFactors = {
      bortleScale: spot.bortleScale || 5,
      cloudCover: 10, // Default to low cloud cover
      seeingConditions: 3, // Default to average
      windSpeed: 5, // Default to low wind
      humidity: 50, // Default to moderate humidity
      moonPhase: 0.5, // Default to half moon
      aqi: 50 // Default to moderate AQI
    };
    
    const result = calculateSIQS(factors);
    return result.score;
  } catch (error) {
    console.error("Error calculating spot SIQS:", error);
    // Return a reasonable default based on Bortle scale
    return spot.bortleScale < 5 ? 6 : 4;
  }
};

/**
 * Estimate SIQS based on available parameters
 */
export const estimateSIQS = (
  bortleScale: number,
  cloudCover: number = 10,
  windSpeed: number = 5,
  moonPhase: number = 0.5
): number => {
  try {
    const result = calculateSIQS({
      bortleScale,
      cloudCover,
      seeingConditions: 3,
      windSpeed,
      humidity: 50,
      moonPhase,
      precipitation: 0,
      aqi: 50
    });
    
    return result.score;
  } catch (error) {
    console.error("Error estimating SIQS:", error);
    return bortleScale < 5 ? 6 : 4;
  }
};
