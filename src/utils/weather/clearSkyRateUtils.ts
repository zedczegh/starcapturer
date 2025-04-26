
/**
 * Enhanced Clear Sky Rate Utilities
 * 
 * Advanced methods for calculating and predicting clear sky conditions
 * based on geographical location, climate patterns, and real-time observations.
 */

import { clearSkyDataCollector } from '@/services/clearSky/clearSkyDataCollector';
import { findClimateRegion } from '@/services/realTimeSiqs/climateRegions';

/**
 * Calculate minimum clear nights per year based on clear sky rate
 * Enhanced with climate region awareness and observation data
 * 
 * @param rate Clear sky rate percentage 
 * @param latitude Location latitude for climate zone adjustments
 * @param longitude Location longitude for regional climate patterns
 * @returns Estimated number of clear nights per year suitable for stargazing
 */
export const getMinimumClearNights = (
  rate: number, 
  latitude?: number,
  longitude?: number
): number => {
  // Basic calculation (based on rate percentage)
  let clearNights = Math.round((rate / 100) * 365 * 0.7);
  
  // If we have latitude/longitude, enhance calculation with climate and observation data
  if (latitude && longitude) {
    try {
      // Check for climate region
      const climateRegion = findClimateRegion(latitude, longitude);
      if (climateRegion) {
        // Apply climate-specific adjustments
        const avgClearSkyRate = climateRegion.avgClearSkyRate || 60;
        const rateDifference = rate - avgClearSkyRate;
        
        // Adjust clear nights based on climate region's characteristics
        if (rateDifference > 0) {
          // Above average for this climate - boost nights, but more conservatively
          clearNights += Math.round(rateDifference * 0.8);
        } else if (rateDifference < 0) {
          // Below average - reduce nights, but less aggressively
          clearNights += Math.round(rateDifference * 0.6);
        }
      }
      
      // Check for user observations if available
      const calculatedRate = clearSkyDataCollector.calculateClearSkyRate(latitude, longitude, 20);
      if (calculatedRate && calculatedRate.confidence > 0.7) {
        // High confidence observations available - blend with our calculation
        const observationBasedNights = Math.round((calculatedRate.rate / 100) * 365 * 0.7);
        clearNights = Math.round(clearNights * 0.6 + observationBasedNights * 0.4);
      }
      
      // Apply hemisphere-based seasonal adjustments
      const isNorthernHemisphere = latitude >= 0;
      const currentMonth = new Date().getMonth(); // 0-11, Jan-Dec
      
      // Adjust for current season
      if (isNorthernHemisphere) {
        if (currentMonth >= 5 && currentMonth <= 7) {  // Jun-Aug (summer)
          clearNights = Math.round(clearNights * 1.1);
        } else if (currentMonth >= 11 || currentMonth <= 1) {  // Dec-Feb (winter)
          clearNights = Math.round(clearNights * 0.9);
        }
      } else {
        if (currentMonth >= 11 || currentMonth <= 1) {  // Dec-Feb (summer in south)
          clearNights = Math.round(clearNights * 1.1);
        } else if (currentMonth >= 5 && currentMonth <= 7) {  // Jun-Aug (winter in south)
          clearNights = Math.round(clearNights * 0.9);
        }
      }
      
      // Adjust for moon phases throughout the year (approximately)
      clearNights = Math.round(clearNights * 0.85);  // About 15% of nights lost to full/near-full moon
    } catch (error) {
      console.warn("Error applying advanced clear sky adjustments:", error);
    }
  }
  
  // Ensure reasonable bounds
  return Math.min(300, Math.max(5, clearNights));
};

/**
 * Calculate clear sky quality index (0-100) from various factors
 */
export const calculateClearSkyQualityIndex = (
  clearSkyRate: number,
  lightPollution: number, // 0-100, 0 = none, 100 = extreme
  elevation: number,      // meters
  annualPrecipDays: number
): number => {
  // Base score from clear sky rate (50% weight)
  let qualityScore = clearSkyRate * 0.5;
  
  // Light pollution impact (20% weight)
  const lightPollutionScore = Math.max(0, 100 - lightPollution);
  qualityScore += lightPollutionScore * 0.2;
  
  // Elevation bonus (15% weight)
  // Higher elevations typically have clearer, more stable air
  const elevationScore = Math.min(100, (elevation / 30) + 40);
  qualityScore += elevationScore * 0.15;
  
  // Precipitation frequency impact (15% weight)
  const precipScore = Math.max(0, 100 - (annualPrecipDays / 2));
  qualityScore += precipScore * 0.15;
  
  return Math.min(100, Math.max(0, qualityScore));
};
