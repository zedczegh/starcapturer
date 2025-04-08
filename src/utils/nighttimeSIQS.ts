
/**
 * Nighttime SIQS calculation utilities
 * Focus on nighttime cloud cover and other astronomy-specific factors
 */
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { SIQSFactors, SIQSResult } from '@/lib/siqs/types';

/**
 * Get a consistent SIQS score value from a location
 * Handles different data formats and ensures a numeric value
 * 
 * @param location Location with SIQS data
 * @returns Numeric SIQS score or 0 if not available
 */
export function getConsistentSiqsValue(location: SharedAstroSpot): number {
  // If we have siqsResult, use that first
  if (location.siqsResult && typeof location.siqsResult.score === 'number') {
    return location.siqsResult.score;
  }
  
  // Otherwise use siqs property
  if (typeof location.siqs === 'number') {
    return location.siqs;
  }
  
  // Handle complex siqs object
  if (typeof location.siqs === 'object' && location.siqs && 'score' in location.siqs) {
    return location.siqs.score;
  }
  
  return 0;
}

/**
 * Check if this is a nighttime SIQS calculation
 */
export function isNighttimeSiqsCalculation(factors?: SIQSFactors): boolean {
  return !!(factors && factors.isNighttimeCalculation && factors.nightForecast?.length);
}

/**
 * Prioritize nighttime cloud cover in SIQS calculations
 * 
 * @param weatherData Weather data with cloud cover
 * @param factors Optional existing factors object to update
 * @returns SIQS factors with nighttime-prioritized cloud cover
 */
export function prioritizeNighttimeCloudCover(
  weatherData: any, 
  factors?: SIQSFactors
): SIQSFactors {
  // Start with existing factors or create new ones
  const siqsFactors: SIQSFactors = factors || {
    cloudCover: 0,
    bortleScale: 4,
    seeingConditions: 3,
    windSpeed: 0,
    humidity: 50
  };
  
  if (!weatherData) {
    return siqsFactors;
  }
  
  // Extract forecast if available
  const forecast = weatherData.forecast?.hourly || 
                   weatherData.forecast?.daily || 
                   weatherData.hourly || 
                   weatherData.daily || 
                   [];
  
  if (forecast && Array.isArray(forecast) && forecast.length > 0) {
    // Filter to nighttime hours (7 PM to 5 AM)
    const nighttimeForecast = forecast.filter(item => {
      if (!item.time) return false;
      const hour = new Date(item.time).getHours();
      return hour >= 19 || hour <= 5;
    });
    
    if (nighttimeForecast.length > 0) {
      // Calculate nighttime average cloud cover
      const nighttimeCloudCover = nighttimeForecast.reduce(
        (sum, item) => sum + (item.cloudCover || 0), 
        0
      ) / nighttimeForecast.length;
      
      // Use nighttime cloud cover with higher priority
      siqsFactors.cloudCover = nighttimeCloudCover;
      siqsFactors.nightForecast = nighttimeForecast;
      siqsFactors.isNighttimeCalculation = true;
    } else {
      // Fall back to regular cloud cover if no nighttime data
      siqsFactors.cloudCover = weatherData.cloudCover || 0;
    }
  } else {
    // No forecast available, use current conditions
    siqsFactors.cloudCover = weatherData.cloudCover || 0;
  }
  
  // Set other factors from weather data
  if (weatherData.windSpeed !== undefined) {
    siqsFactors.windSpeed = weatherData.windSpeed;
  }
  
  if (weatherData.humidity !== undefined) {
    siqsFactors.humidity = weatherData.humidity;
  }
  
  return siqsFactors;
}

/**
 * Calculate nighttime-optimized SIQS score
 * 
 * @param factors SIQS calculation factors
 * @returns SIQS calculation result prioritizing nighttime conditions
 */
export function calculateNighttimeSiqs(factors: SIQSFactors): SIQSResult {
  // Initialize weights for different factors
  const cloudWeight = 0.4;  // Increased from 0.3
  const bortleWeight = 0.3;
  const windWeight = 0.15;
  const humidityWeight = 0.15;
  
  // Calculate scores for each factor (0-10 scale)
  const cloudScore = 10 - (factors.cloudCover / 10);
  const bortleScore = 10 - factors.bortleScale;
  const windScore = Math.max(0, 10 - (factors.windSpeed / 2));
  const humidityScore = 10 - (factors.humidity / 10);
  
  // Calculate weighted average
  const weightedScore = (
    cloudWeight * cloudScore +
    bortleWeight * bortleScore +
    windWeight * windScore +
    humidityWeight * humidityScore
  );
  
  // Viability threshold - SIQS of 5 or higher is viable
  const isViable = weightedScore >= 5;
  
  // Create factor details
  const factorDetails = [
    {
      name: 'Cloud Cover',
      score: cloudScore,
      description: `${Math.round(factors.cloudCover)}% cloud coverage`
    },
    {
      name: 'Light Pollution',
      score: bortleScore,
      description: `Bortle ${factors.bortleScale} sky`
    },
    {
      name: 'Wind',
      score: windScore,
      description: `${Math.round(factors.windSpeed)} km/h wind speed`
    },
    {
      name: 'Humidity',
      score: humidityScore,
      description: `${Math.round(factors.humidity)}% humidity`
    }
  ];
  
  // Add nighttime metadata if available
  const result: SIQSResult = {
    score: parseFloat(weightedScore.toFixed(1)),
    isViable,
    factors: factorDetails
  };
  
  // Add metadata for nighttime calculations
  if (factors.isNighttimeCalculation && factors.nightForecast && factors.nightForecast.length > 0) {
    result.metadata = {
      calculationType: 'nighttime',
      timestamp: new Date().toISOString(),
    };
    
    // Calculate evening and morning cloud cover
    const evening = factors.nightForecast.filter(item => {
      const hour = new Date(item.time).getHours();
      return hour >= 19 || hour <= 0;
    });
    
    const morning = factors.nightForecast.filter(item => {
      const hour = new Date(item.time).getHours();
      return hour > 0 && hour <= 5;
    });
    
    if (evening.length > 0) {
      result.metadata.eveningCloudCover = evening.reduce(
        (sum, item) => sum + (item.cloudCover || 0), 
        0
      ) / evening.length;
    }
    
    if (morning.length > 0) {
      result.metadata.morningCloudCover = morning.reduce(
        (sum, item) => sum + (item.cloudCover || 0), 
        0
      ) / morning.length;
    }
    
    result.metadata.avgNightCloudCover = factors.cloudCover;
  }
  
  return result;
}

/**
 * Legacy function name for backward compatibility
 */
export function calculateNighttimeSIQS(
  locationData: any,
  forecastData: any,
  translator: any
): SIQSResult | null {
  // This is maintained for backward compatibility
  if (!forecastData || !forecastData.hourly || !locationData) {
    console.log("Missing required data for nighttime SIQS calculation");
    return null;
  }
  
  const factors: SIQSFactors = {
    cloudCover: locationData.weatherData?.cloudCover || 0,
    bortleScale: locationData.bortleScale || 5,
    seeingConditions: locationData.seeingConditions || 3,
    windSpeed: locationData.weatherData?.windSpeed || 0,
    humidity: locationData.weatherData?.humidity || 50,
    moonPhase: locationData.moonPhase || 0
  };
  
  // Add nighttime forecast data
  const nightForecast = forecastData.hourly.filter((item: any) => {
    if (!item.time) return false;
    const hour = new Date(item.time).getHours();
    return hour >= 19 || hour <= 5;
  });
  
  factors.nightForecast = nightForecast;
  factors.isNighttimeCalculation = true;
  
  return calculateNighttimeSiqs(factors);
}
