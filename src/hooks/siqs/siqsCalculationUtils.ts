
import { calculateSIQS } from "@/lib/calculateSIQS";
import { calculateNighttimeSIQS } from "@/utils/nighttimeSIQS";
import { 
  mpsasToBortle, 
  bortleToMpsas, 
  getBortleBasedSIQS 
} from "@/utils/darkSkyMeterUtils";

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
 * Enhanced function to calculate SIQS with weather data and improved sky quality measurements
 */
export async function calculateSIQSWithWeatherData(
  weatherData: any,
  bortleScale: number,
  seeingConditions: number,
  moonPhase: number,
  forecastData: any | null
): Promise<any> {
  // First check if we have camera-based MPSAS measurements from the device
  const hasMeasuredData = weatherData?.skyBrightness?.mpsas || false;
  
  // If we have direct sky measurements, prioritize them
  if (hasMeasuredData) {
    // Use measured sky brightness as highest priority
    const measuredMpsas = weatherData.skyBrightness.mpsas;
    const measuredBortle = mpsasToBortle(measuredMpsas);
    
    console.log(`Using device-measured sky brightness: ${measuredMpsas} MPSAS (Bortle ${measuredBortle.toFixed(1)})`);
    
    // Override the provided Bortle scale with the measured one
    bortleScale = measuredBortle;
    
    // Calculate SIQS using the measured Bortle scale
    const cameraSIQS = getBortleBasedSIQS(measuredBortle, weatherData.cloudCover);
    
    // If we have a valid SIQS from camera, return it with the factors
    if (cameraSIQS > 0) {
      return {
        score: cameraSIQS,
        isViable: cameraSIQS >= 4.0,
        factors: [
          {
            name: "Sky Brightness",
            score: 10 - (measuredBortle - 1) * (10/8),
            description: `Measured sky brightness: ${measuredMpsas.toFixed(2)} MPSAS (Bortle ${measuredBortle.toFixed(1)})`
          },
          {
            name: "Cloud Cover",
            score: 10 - (weatherData.cloudCover / 10),
            description: `Cloud cover: ${weatherData.cloudCover}%`
          }
        ],
        method: "camera-measurement"
      };
    }
  }

  // Try to calculate SIQS using nighttime forecast data if no direct measurement
  if (forecastData && forecastData.hourly) {
    try {
      const locationWithWeather = {
        weatherData,
        bortleScale,
        seeingConditions,
        moonPhase
      };
      
      const nighttimeSIQS = calculateNighttimeSIQS(locationWithWeather, forecastData, null);
      if (nighttimeSIQS) {
        console.log("Using nighttime forecast for SIQS calculation:", nighttimeSIQS.score);
        return {
          ...nighttimeSIQS,
          method: "forecast-based"
        };
      }
    } catch (error) {
      console.error("Error calculating nighttime SIQS:", error);
    }
  }
  
  // Fall back to standard calculation if nighttime calculation failed
  console.log("Falling back to standard SIQS calculation");
  const standardSIQS = calculateSIQS({
    cloudCover: weatherData.cloudCover,
    bortleScale,
    seeingConditions,
    windSpeed: weatherData.windSpeed,
    humidity: weatherData.humidity,
    moonPhase,
    precipitation: weatherData.precipitation,
    weatherCondition: weatherData.weatherCondition,
    aqi: weatherData.aqi
  });
  
  return {
    ...standardSIQS,
    method: "standard"
  };
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
  return value >= 5.0; // Updated threshold to 5.0
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

/**
 * Convert Bortle scale to a standardized SIQS component
 * This ensures consistent SIQS calculations from Bortle values
 */
export function bortleToSIQSComponent(bortleScale: number): number {
  // Bortle scale is 1-9, with 1 being best (darkest)
  // SIQS is 0-10, with 10 being best
  
  // Ensure valid Bortle value
  const validBortle = Math.min(9, Math.max(1, bortleScale));
  
  // Non-linear conversion to prioritize darker skies
  // Bortle 1-3 (dark) get high SIQS values (8-10)
  // Bortle 4-6 (moderate) get medium SIQS values (4-7)
  // Bortle 7-9 (bright) get low SIQS values (0-3)
  
  if (validBortle <= 3) {
    // Dark skies (high quality)
    return 10 - (validBortle - 1) * 0.7;
  } else if (validBortle <= 6) {
    // Moderate light pollution
    return 7.9 - (validBortle - 3) * 1.3;
  } else {
    // Heavy light pollution
    return 4 - (validBortle - 6) * 1.3;
  }
}
