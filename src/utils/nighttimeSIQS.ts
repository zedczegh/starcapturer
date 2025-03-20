
import { useEffect } from 'react';

/**
 * Utility for calculating and handling Nighttime SIQS
 */

/**
 * Calculates the SIQS score focusing on nighttime hours (6 PM to 7 AM)
 * @param locationData Location data with coordinates and settings
 * @param forecastData Forecast data with hourly entries
 * @param translator Translation function for localization
 * @returns SIQS data object or null
 */
export function calculateNighttimeSIQS(locationData: any, forecastData: any, translator: any) {
  if (!locationData || !forecastData?.hourly?.time) {
    console.log("Missing data for nighttime SIQS calculation");
    return null;
  }
  
  // Extract nighttime hours (6 PM to 7 AM)
  const nighttimeHours = [];
  
  for (let i = 0; i < forecastData.hourly.time.length; i++) {
    const date = new Date(forecastData.hourly.time[i]);
    const hour = date.getHours();
    
    // Include hours between 6 PM (18) and 7 AM (7)
    if (hour >= 18 || hour <= 7) {
      nighttimeHours.push({
        time: forecastData.hourly.time[i],
        cloudCover: forecastData.hourly.cloud_cover?.[i] ?? 0,
        windSpeed: forecastData.hourly.wind_speed_10m?.[i] ?? 0,
        humidity: forecastData.hourly.relative_humidity_2m?.[i] ?? 0,
        precipitation: forecastData.hourly.precipitation?.[i] ?? 0,
        // Optional fields
        weatherCode: forecastData.hourly.weather_code?.[i],
        temperature: forecastData.hourly.temperature_2m?.[i]
      });
    }
  }
  
  console.log(`Found ${nighttimeHours.length} nighttime forecast hours`);
  
  if (nighttimeHours.length === 0) {
    console.log("No nighttime hours found in forecast data");
    return null;
  }
  
  // Calculate average values for factors
  const avgCloudCover = nighttimeHours.reduce((sum, hour) => sum + hour.cloudCover, 0) / nighttimeHours.length;
  const avgWindSpeed = nighttimeHours.reduce((sum, hour) => sum + hour.windSpeed, 0) / nighttimeHours.length;
  const avgHumidity = nighttimeHours.reduce((sum, hour) => sum + hour.humidity, 0) / nighttimeHours.length;
  const avgPrecipitation = nighttimeHours.reduce((sum, hour) => sum + (hour.precipitation || 0), 0) / nighttimeHours.length;
  
  // Import needed functions dynamically to avoid circular dependencies
  const { calculateSIQS } = require('../lib/calculateSIQS');
  
  // Prepare SIQS factors
  const siqsFactors = {
    cloudCover: avgCloudCover,
    bortleScale: locationData.bortleScale || 4,
    seeingConditions: locationData.seeingConditions || 2.5,
    windSpeed: avgWindSpeed,
    humidity: avgHumidity,
    moonPhase: locationData.moonPhase || 0,
    precipitation: avgPrecipitation,
    nightForecast: nighttimeHours,
    aqi: locationData.weatherData?.aqi
  };
  
  // Calculate SIQS using standard algorithm
  const siqsResult = calculateSIQS(siqsFactors);
  console.log("Calculated nighttime SIQS:", siqsResult.score);
  
  return siqsResult;
}

/**
 * Calculate average SIQS score from forecast data (6pm-7am)
 * @param dailyForecast Daily forecast data from API
 * @returns Average SIQS score (0-10 scale)
 */
export function getAverageForecastSIQS(dailyForecast: any): number {
  // If forecast data has SIQS values attached, use those
  if (dailyForecast && Array.isArray(dailyForecast.time)) {
    // Access the forecast rows from parent component
    const forecastRows = document.querySelectorAll('[data-testid="forecast-row"]');
    const siqsScores: number[] = [];
    
    // Extract SIQS values from row attributes
    forecastRows.forEach(row => {
      const siqsValue = parseFloat(row.getAttribute('data-siqs') || '0');
      if (siqsValue > 0) {
        siqsScores.push(siqsValue);
      }
    });
    
    // If we found SIQS values in the DOM
    if (siqsScores.length > 0) {
      const avgSIQS = siqsScores.reduce((sum, score) => sum + score, 0) / siqsScores.length;
      console.log("Using average forecast SIQS from DOM:", avgSIQS.toFixed(1));
      return avgSIQS;
    }
  }
  
  // If no SIQS values found, return 0 (will fall back to other methods)
  return 0;
}

/**
 * Custom hook to trigger auto-refresh when location details page loads
 * @param refreshFunction The refresh function to call
 */
export function useAutoRefreshOnLoad(refreshFunction: () => void) {
  useEffect(() => {
    // Small delay to allow component to mount properly
    const timer = setTimeout(() => {
      console.log("Auto-refreshing data on location details page load");
      refreshFunction();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [refreshFunction]);
}
