
/**
 * Enhanced SIQS calculation with protection against algorithm tampering
 * This implementation uses protected factors and validation
 */
import { protectedFactors, calculateWeightedScore } from './siqs/protectedFactors';
import { LightPollutionLevel, SIQSResult as SIQSResultType } from './siqs/types';
import { getEffectiveCloudCover, validateSiqsInputs } from './siqs/weatherDataUtils';
import { createFactorDescriptions, addClearSkyFactor, determineSiqsLevel } from './siqs/siqsFactorDescriptions';

// Type definition for SIQS calculation inputs
export interface SIQSInputData {
  cloudCover: number;
  bortleScale: number;
  seeingConditions: number;
  windSpeed: number;
  humidity: number;
  moonPhase: number;
  precipitation?: number;
  weatherCondition?: string;
  aqi?: number;
  clearSkyRate?: number;
  nightForecast?: any[];
}

// Type definition for SIQS calculation result
export interface SIQSResult {
  score: number;
  factors: {
    name: string;
    score: number;
    description?: string;
    nighttimeData?: any;
  }[];
  level: LightPollutionLevel;
  isViable: boolean;
}

/**
 * Calculate SIQS (Stellar Imaging Quality Score)
 * This protected version includes input validation and safeguards
 * 
 * @param data Environmental data inputs
 * @returns SIQS calculation result
 */
export function calculateSIQS(data: SIQSInputData): SIQSResult {
  // Create a validation copy of inputs with fallback values
  const validatedData = validateSiqsInputs(data);

  // Adjust cloud cover for precipitation and weather conditions
  const effectiveCloudCover = getEffectiveCloudCover(
    validatedData.cloudCover, 
    validatedData.precipitation, 
    data.weatherCondition
  );
  
  // Calculate individual factor scores using protected functions
  const cloudScore = protectedFactors.calculateCloudScore(effectiveCloudCover);
  const lightPollutionScore = protectedFactors.calculateLightPollutionScore(validatedData.bortleScale);
  const seeingScore = protectedFactors.calculateSeeingScore(validatedData.seeingConditions);
  const windScore = protectedFactors.calculateWindScore(validatedData.windSpeed);
  const humidityScore = protectedFactors.calculateHumidityScore(validatedData.humidity);
  const moonScore = protectedFactors.calculateMoonScore(validatedData.moonPhase);
  
  // AQI is optional, use default if not provided
  const aqiScore = validatedData.aqi !== undefined ? 
    protectedFactors.calculateAQIScore(validatedData.aqi) : 
    70; // Default moderate air quality
  
  // Clear sky rate is optional
  const clearSkyScore = validatedData.clearSkyRate !== undefined ?
    protectedFactors.calculateClearSkyScore(validatedData.clearSkyRate) :
    undefined;
  
  // Store factor scores for weighted calculation
  const factorScores: any = {
    cloud: cloudScore,
    lightPollution: lightPollutionScore,
    seeing: seeingScore,
    wind: windScore,
    humidity: humidityScore,
    moon: moonScore,
    aqi: aqiScore
  };
  
  // Add clear sky rate if available
  if (clearSkyScore !== undefined) {
    factorScores.clearSky = clearSkyScore;
  }
  
  // Calculate weighted score using protected method
  const rawScore = calculateWeightedScore(factorScores);
  
  // Round to 1 decimal place for consistency
  const finalScore = Math.round(rawScore * 10) / 10;
  
  // Get level classification
  const level = determineSiqsLevel(finalScore);
  
  // Add all calculated values to validatedData for description creation
  const enrichedData = {
    ...validatedData,
    effectiveCloudCover,
    cloudScore,
    lightPollutionScore,
    seeingScore,
    windScore,
    humidityScore,
    moonScore,
    aqiScore
  };
  
  // Create factor descriptions for UI display
  let factors = createFactorDescriptions(enrichedData);
  
  // Add clear sky factor if available
  factors = addClearSkyFactor(factors, validatedData, clearSkyScore);
  
  // Determine if conditions are viable for astrophotography
  const isViable = finalScore >= 5.0; // Consider viable if score is at least 5.0
  
  return {
    score: finalScore,
    factors,
    level,
    isViable
  };
}
