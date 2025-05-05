
/**
 * Enhanced forecast API with improved reliability and error handling
 */

import { validateCoordinates, Coordinates } from './coordinates';
import { reliableFetch } from '@/utils/api/reliableFetch';
import { toast } from 'sonner';

/**
 * Enhanced forecast data with reliability metrics and validation
 */
export interface EnhancedForecastResponse {
  forecast: any;
  reliability: number;
  source: string;
  timestamp: number;
  validationResults?: {
    isValid: boolean;
    issues?: string[];
  };
}

/**
 * Validate forecast data structure and content
 */
function validateForecastData(data: any): { isValid: boolean; issues?: string[] } {
  const issues: string[] = [];
  
  if (!data) {
    return { isValid: false, issues: ['No data returned'] };
  }
  
  // Check for required top-level properties
  if (!data.latitude || !data.longitude) {
    issues.push('Missing coordinates in response');
  }
  
  // Validate hourly data format if present
  if (data.hourly) {
    if (!Array.isArray(data.hourly.time) || data.hourly.time.length === 0) {
      issues.push('Invalid or empty hourly time data');
    }
    
    const requiredHourlyFields = [
      'temperature_2m', 
      'cloud_cover'
    ];
    
    for (const field of requiredHourlyFields) {
      if (!Array.isArray(data.hourly[field]) || data.hourly[field].length === 0) {
        issues.push(`Missing or invalid hourly ${field} data`);
      }
    }
    
    // Check that arrays have matching lengths
    if (Array.isArray(data.hourly.time) && data.hourly.time.length > 0) {
      const timeLength = data.hourly.time.length;
      for (const key in data.hourly) {
        if (Array.isArray(data.hourly[key]) && data.hourly[key].length !== timeLength) {
          issues.push(`Mismatched array lengths for hourly.${key}`);
        }
      }
    }
  }
  
  // Validate daily data format if present
  if (data.daily) {
    if (!Array.isArray(data.daily.time) || data.daily.time.length === 0) {
      issues.push('Invalid or empty daily time data');
    }
    
    // Similar checks for daily data fields could be added here
  }
  
  return { 
    isValid: issues.length === 0,
    issues: issues.length > 0 ? issues : undefined 
  };
}

/**
 * Fetch forecast data with enhanced reliability
 */
export async function fetchEnhancedForecastData(
  coordinates: Coordinates, 
  signal?: AbortSignal
): Promise<EnhancedForecastResponse | null> {
  try {
    const validCoords = validateCoordinates(coordinates);
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${validCoords.latitude}&longitude=${validCoords.longitude}` +
      `&hourly=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,weather_code` +
      `&forecast_days=${validCoords.days || 3}&timezone=auto`;
    
    // Use our reliable fetch utility with retries
    const data = await reliableFetch(url, {
      signal,
      maxRetries: 2,
      endpointName: 'open-meteo/forecast'
    });
    
    // Validate the returned data
    const validationResults = validateForecastData(data);
    
    // Return enhanced response
    return {
      forecast: data,
      reliability: validationResults.isValid ? 100 : 70,
      source: 'open-meteo',
      timestamp: Date.now(),
      validationResults
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Enhanced forecast data fetch aborted');
      throw error;
    }
    console.error("Error fetching enhanced forecast data:", error);
    
    // Notify user of the error
    toast.error('Failed to fetch weather forecast data', {
      description: 'The system will automatically retry when possible'
    });
    
    return null;
  }
}

/**
 * Fetch long range forecast with enhanced reliability
 */
export async function fetchEnhancedLongRangeForecastData(
  coordinates: Coordinates, 
  signal?: AbortSignal
): Promise<EnhancedForecastResponse | null> {
  try {
    const validCoords = validateCoordinates(coordinates);
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${validCoords.latitude}&longitude=${validCoords.longitude}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,` +
      `wind_speed_10m_max,relative_humidity_2m_mean,cloud_cover_mean,weather_code` +
      `&forecast_days=${validCoords.days || 16}&timezone=auto`;
    
    // Use reliable fetch with retries
    const data = await reliableFetch(url, {
      signal,
      maxRetries: 2,
      endpointName: 'open-meteo/long-range-forecast'
    });
    
    // Validate returned data
    const validationResults = validateForecastData(data);
    
    return {
      forecast: data,
      reliability: validationResults.isValid ? 100 : 70,
      source: 'open-meteo',
      timestamp: Date.now(),
      validationResults
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Enhanced long range forecast data fetch aborted');
      throw error;
    }
    console.error("Error fetching enhanced long range forecast data:", error);
    
    // Notify user of the error
    toast.error('Failed to fetch long-range weather forecast', {
      description: 'The system will automatically retry when possible'
    });
    
    return null;
  }
}
