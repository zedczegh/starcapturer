
/**
 * SIQS anomaly detection and correction utilities
 */
import { SiqsResult, WeatherDataWithClearSky } from './siqsTypes';
import { logWarning } from '@/utils/debug/errorLogger';

/**
 * Detect and fix anomalies in SIQS results
 */
export function detectAndFixAnomalies(
  siqsResult: SiqsResult, 
  weatherData: WeatherDataWithClearSky,
  locationData?: { latitude: number; longitude: number }
): SiqsResult {
  if (!siqsResult) return siqsResult;
  
  const correctedSiqs = { ...siqsResult };
  let wasModified = false;
  
  // Check for physically impossible high scores with high cloud cover
  if (weatherData.cloudCover > 80 && correctedSiqs.siqs > 6) {
    logWarning(`Anomaly detected: High SIQS (${correctedSiqs.siqs}) with high cloud cover (${weatherData.cloudCover}%)`);
    correctedSiqs.siqs = Math.min(5.5, correctedSiqs.siqs);
    wasModified = true;
  }
  
  // Check for zero-value SIQS with clear conditions
  if (correctedSiqs.siqs === 0 && weatherData.cloudCover < 30 && !weatherData.precipitation) {
    logWarning(`Anomaly detected: Zero SIQS with good weather conditions (${weatherData.cloudCover}% cloud cover)`);
    correctedSiqs.siqs = 5.0;
    wasModified = true;
  }
  
  // Ensure score is in valid range
  if (correctedSiqs.siqs > 10) {
    logWarning(`Anomaly detected: SIQS out of range (${correctedSiqs.siqs})`);
    correctedSiqs.siqs = correctedSiqs.siqs / 10;
    wasModified = true;
  }
  
  // Update metadata if corrections were made
  if (wasModified) {
    if (!correctedSiqs.metadata) {
      correctedSiqs.metadata = { calculatedAt: new Date().toISOString() };
    }
    if (!correctedSiqs.metadata.algorithm) {
      correctedSiqs.metadata.algorithm = { version: '1.0', adjustments: [] };
    }
    
    correctedSiqs.metadata.algorithm.adjustments = [
      ...(correctedSiqs.metadata.algorithm.adjustments || []),
      'anomaly-correction'
    ];
  }
  
  return correctedSiqs;
}

/**
 * Assess the reliability of weather data for SIQS calculation
 */
export function assessDataReliability(
  weatherData: WeatherDataWithClearSky, 
  forecastData: any
): { 
  reliable: boolean; 
  confidenceScore: number;
  issues: string[];
} {
  const issues: string[] = [];
  let confidenceScore = 10;
  
  // Check for missing crucial data
  if (!weatherData) {
    issues.push('Missing weather data');
    confidenceScore -= 8;
  } else {
    // Check for specific missing fields
    if (weatherData.cloudCover === undefined) {
      issues.push('Missing cloud cover data');
      confidenceScore -= 4;
    }
    
    if (weatherData.temperature === undefined) {
      issues.push('Missing temperature data');
      confidenceScore -= 1;
    }
    
    if (weatherData.humidity === undefined) {
      issues.push('Missing humidity data');
      confidenceScore -= 1;
    }
    
    // Check for extreme values that might indicate errors
    if (weatherData.cloudCover > 100 || weatherData.cloudCover < 0) {
      issues.push('Invalid cloud cover value');
      confidenceScore -= 3;
    }
    
    if (weatherData.temperature > 60 || weatherData.temperature < -80) {
      issues.push('Suspiciously extreme temperature');
      confidenceScore -= 1;
    }
  }
  
  // Check forecast data quality
  if (!forecastData) {
    issues.push('Missing forecast data');
    confidenceScore -= 2;
  } else if (!forecastData.hourly) {
    issues.push('Missing hourly forecast');
    confidenceScore -= 1;
  }
  
  // Ensure confidenceScore is in the valid range
  confidenceScore = Math.max(1, Math.min(10, confidenceScore));
  
  return {
    reliable: confidenceScore >= 7,
    confidenceScore,
    issues
  };
}
