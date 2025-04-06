
import { calculateSIQS } from "@/lib/calculateSIQS";
import { extractNightForecasts } from "@/components/forecast/ForecastUtils";
import { hasHighCloudCover } from "@/components/forecast/ForecastUtils";
import { validateCloudCover } from "@/lib/siqs/utils";
import { SIQSResult } from "@/lib/siqs/types";

/**
 * Calculate SIQS score based on nighttime forecast data
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param bortleScale Bortle scale value
 * @param seeingConditions Seeing conditions quality (1-5)
 * @param moonPhase Moon phase (0-1)
 * @returns Promise resolving to SIQS result or null
 */
export async function calculateNighttimeSIQS(
  latitude: number,
  longitude: number,
  bortleScale: number,
  seeingConditions: number = 3,
  moonPhase: number = 0.5
): Promise<SIQSResult | null> {
  console.log("Starting nighttime SIQS calculation");
  
  try {
    // Fetch forecast data for the location
    const { fetchForecastData } = await import("@/lib/api");
    const forecastData = await fetchForecastData({
      latitude,
      longitude,
      days: 2  // Get 2 days of forecast for complete night coverage
    });
    
    if (!forecastData?.hourly || forecastData.hourly.length === 0) {
      console.warn("No forecast data available for nighttime SIQS calculation");
      return null;
    }
    
    // Extract nighttime hours (from 6 PM to 8 AM)
    const nighttimeForecast = extractNightForecasts(forecastData.hourly);
    
    console.log(`Found ${nighttimeForecast.length} nighttime forecast hours (6 PM to 8 AM)`);
    
    // If no nighttime forecast data, return null
    if (!nighttimeForecast.length) {
      console.warn("No nighttime hours in forecast data");
      return null;
    }
    
    // Split into evening and morning
    const eveningHours = nighttimeForecast.filter(hour => {
      const hourNum = new Date(hour.time).getHours();
      return hourNum >= 18; // 6 PM and later
    });
    
    const morningHours = nighttimeForecast.filter(hour => {
      const hourNum = new Date(hour.time).getHours();
      return hourNum < 8; // Before 8 AM
    });
    
    console.log(`Evening forecasts (6PM-12AM): ${eveningHours.length}, Morning forecasts (1AM-8AM): ${morningHours.length}`);
    
    // Calculate average values with more weight given to evening hours
    const eveningCloudAvg = eveningHours.reduce((sum, hour) => 
      sum + (hour.cloudcover || 0), 0) / Math.max(1, eveningHours.length);
      
    const morningCloudAvg = morningHours.reduce((sum, hour) => 
      sum + (hour.cloudcover || 0), 0) / Math.max(1, morningHours.length);
    
    console.log(`Average cloud cover - Evening: ${eveningCloudAvg.toFixed(1)}%, Morning: ${morningCloudAvg.toFixed(1)}%`);
    
    // Weight evening hours slightly more (better for most observations)
    const weightedCloudCover = eveningHours.length && morningHours.length ? 
      (eveningCloudAvg * 0.6) + (morningCloudAvg * 0.4) : 
      eveningHours.length ? eveningCloudAvg : morningCloudAvg;
    
    console.log(`Weighted average cloud cover for night: ${weightedCloudCover.toFixed(1)}%`);
    
    // Get other average values
    const avgWindSpeed = nighttimeForecast.reduce((sum, hour) => 
      sum + (hour.windspeed || 0), 0) / nighttimeForecast.length;
      
    const avgHumidity = nighttimeForecast.reduce((sum, hour) => 
      sum + (hour.humidity || 0), 0) / nighttimeForecast.length;
    
    console.log(`SIQS calculation with ${nighttimeForecast.length} nighttime forecast items`);
    console.log(`Using nighttime forecast data for SIQS calculation`);
    console.log(`Average values - Cloud: ${weightedCloudCover.toFixed(1)}%, Wind: ${avgWindSpeed.toFixed(1)}km/h, Humidity: ${avgHumidity.toFixed(1)}%`);
    
    // Calculate SIQS based on averaged nighttime data
    const siqsResult = calculateSIQS({
      cloudCover: validateCloudCover(weightedCloudCover),
      bortleScale: bortleScale || 4,
      seeingConditions: seeingConditions || 3,
      windSpeed: avgWindSpeed,
      humidity: avgHumidity,
      moonPhase: moonPhase || 0.5,
      nightForecast: nighttimeForecast
    });
    
    console.log(`Final SIQS score based on nighttime forecast: ${siqsResult.score.toFixed(1)}`);
    console.log(`Final SIQS score based on nighttime forecast: ${siqsResult.score.toFixed(1)}`);
    
    console.log(`Nighttime SIQS calculated: ${siqsResult.score}`);
    return siqsResult;
  } catch (error) {
    console.error("Error calculating nighttime SIQS:", error);
    return null;
  }
}

/**
 * Check if there are any good viewing windows in the forecast
 * @param forecastHours Hourly forecast data array
 * @returns Object containing information about viewing windows
 */
export function findViewingWindows(
  forecastHours: any[]
): { hasGoodWindow: boolean; bestStartHour: string | null; durationHours: number } {
  if (!forecastHours || forecastHours.length === 0) {
    return { hasGoodWindow: false, bestStartHour: null, durationHours: 0 };
  }
  
  // Consider a sequence of 3+ hours with cloud cover < 30% as a good viewing window
  let currentStart = -1;
  let currentLength = 0;
  let bestStart = -1;
  let bestLength = 0;
  
  // Find longest sequence of good hours
  for (let i = 0; i < forecastHours.length; i++) {
    const hour = forecastHours[i];
    
    if (!hasHighCloudCover(hour)) {
      // This hour is good for viewing
      if (currentStart === -1) {
        // Start of a new sequence
        currentStart = i;
        currentLength = 1;
      } else {
        // Continue sequence
        currentLength++;
      }
    } else {
      // This hour is not good for viewing
      if (currentStart !== -1) {
        // End of sequence
        if (currentLength > bestLength) {
          bestStart = currentStart;
          bestLength = currentLength;
        }
        
        // Reset sequence
        currentStart = -1;
        currentLength = 0;
      }
    }
  }
  
  // Check if the last sequence is best
  if (currentStart !== -1 && currentLength > bestLength) {
    bestStart = currentStart;
    bestLength = currentLength;
  }
  
  // A good window needs at least 2 consecutive hours
  const hasGoodWindow = bestLength >= 2;
  
  // Format best start time (if found)
  let bestStartHour: string | null = null;
  if (hasGoodWindow && bestStart >= 0 && forecastHours[bestStart]) {
    const startTime = new Date(forecastHours[bestStart].time);
    bestStartHour = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  return {
    hasGoodWindow,
    bestStartHour,
    durationHours: bestLength
  };
}
