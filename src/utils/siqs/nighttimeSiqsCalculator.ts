
import { calculateNighttimeSiqs as calculateNighttimeSiqsFromCloudCover } from '@/utils/siqs/cloudCoverUtils';

/**
 * Utility function to ensure nighttime SIQS calculations are consistent across the application
 * 
 * @param location The location data
 * @param forecastData Forecast data containing cloud cover information
 * @returns SIQS value on a scale of 0-10
 */
export function calculateNighttimeSiqsFromForecast(
  location: any,
  forecastData: any
): number {
  if (!location || !forecastData || !forecastData.hourly) {
    console.log("Missing required data for nighttime SIQS calculation");
    return 0;
  }
  
  try {
    // Extract nighttime cloud cover information
    const hourlyData = forecastData.hourly;
    const times = hourlyData.time || [];
    const cloudCover = hourlyData.cloudcover || [];
    
    if (!times.length || !cloudCover.length) {
      console.log("Missing hourly data for nighttime SIQS calculation");
      return 0;
    }
    
    // Filter for nighttime hours (6 PM to 7 AM)
    const nighttimeData = times.map((time: string, index: number) => {
      const date = new Date(time);
      const hour = date.getHours();
      const isNighttime = hour >= 18 || hour < 7;
      
      return {
        time,
        hour,
        isNighttime,
        cloudCover: cloudCover[index] || 0
      };
    }).filter((data: any) => data.isNighttime);
    
    if (!nighttimeData.length) {
      console.log("No nighttime hours found in forecast data");
      return 0;
    }
    
    // Calculate average nighttime cloud cover
    const totalCloudCover = nighttimeData.reduce((sum: number, data: any) => sum + data.cloudCover, 0);
    const avgNighttimeCloudCover = totalCloudCover / nighttimeData.length;
    
    console.log(`Average nighttime cloud cover: ${avgNighttimeCloudCover.toFixed(1)}%`);
    
    // Use cloud cover utility to calculate SIQS with heavy emphasis on nighttime cloud cover
    const bortleScale = location.bortleScale || 5;
    const siqs = calculateNighttimeSiqsFromCloudCover(avgNighttimeCloudCover, bortleScale);
    
    console.log(`Calculated nighttime SIQS: ${siqs.toFixed(1)} (Bortle: ${bortleScale})`);
    
    return siqs;
    
  } catch (error) {
    console.error("Error calculating nighttime SIQS from forecast:", error);
    return 0;
  }
}

/**
 * Extracts nighttime forecast data from hourly forecast
 * 
 * @param forecastData Full forecast data object
 * @returns Object containing filtered nighttime data
 */
export function extractNighttimeForecast(forecastData: any) {
  if (!forecastData?.hourly?.time) {
    return { nighttimeItems: [], avgNighttimeCloudCover: 50 };
  }
  
  try {
    const hourlyData = forecastData.hourly;
    const times = hourlyData.time || [];
    const cloudCover = hourlyData.cloudcover || [];
    
    // Filter for nighttime hours (6 PM to 7 AM)
    const nighttimeItems = times.map((time: string, index: number) => {
      const date = new Date(time);
      const hour = date.getHours();
      const isNighttime = hour >= 18 || hour < 7;
      
      return {
        time,
        hour,
        isNighttime,
        cloudCover: cloudCover[index] || 0
      };
    }).filter((data: any) => data.isNighttime);
    
    // Calculate average nighttime cloud cover
    const totalCloudCover = nighttimeItems.reduce((sum: number, data: any) => sum + data.cloudCover, 0);
    const avgNighttimeCloudCover = nighttimeItems.length ? totalCloudCover / nighttimeItems.length : 50;
    
    return { nighttimeItems, avgNighttimeCloudCover };
  } catch (error) {
    console.error("Error extracting nighttime forecast:", error);
    return { nighttimeItems: [], avgNighttimeCloudCover: 50 };
  }
}
