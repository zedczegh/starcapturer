
/**
 * Enhanced SIQS (Stellar Imaging Quality Score) calculation system
 * Combines weather, light pollution, and atmospheric factors for a comprehensive score
 */

import { SIQSInputParams, SIQSResult, SIQSFactor } from './siqs/types';
import { validateCloudCover, isImagingImpossible, siqsToColor } from './siqs/utils';
import {
  calculateCloudScore,
  calculateLightPollutionScore,
  calculateSeeingScore, 
  calculateWindScore,
  calculateHumidityScore,
  calculateMoonScore,
  calculateAQIScore,
  calculateClearSkyScore
} from './siqs/factors';

/**
 * Calculate SIQS score based on input parameters
 * @param params Input parameters for SIQS calculation
 * @returns SIQS result object with score and factors
 */
export function calculateSIQS(params: SIQSInputParams): SIQSResult {
  // Validate and normalize cloud cover
  const cloudCover = validateCloudCover(params.cloudCover);
  
  // Check for impossible imaging conditions
  if (isImagingImpossible(cloudCover, params.precipitation)) {
    return {
      score: 0,
      factors: [
        {
          name: "Cloud Cover",
          score: 0,
          weight: 1.5,
          description: "Imaging is impossible due to cloud cover or precipitation",
          rawValue: cloudCover
        }
      ],
      timestamp: new Date().toISOString(),
      isViable: false
    };
  }
  
  // Calculate individual factor scores
  const cloudFactor: SIQSFactor = {
    name: "Cloud Cover",
    score: calculateCloudScore(cloudCover),
    weight: 1.5, // Cloud cover has high importance
    description: getCloudDescription(cloudCover),
    rawValue: cloudCover
  };
  
  const lightPollutionFactor: SIQSFactor = {
    name: "Light Pollution",
    score: calculateLightPollutionScore(params.bortleScale),
    weight: 1.5, // Light pollution has high importance
    description: getLightPollutionDescription(params.bortleScale),
    rawValue: params.bortleScale
  };
  
  const seeingFactor: SIQSFactor = {
    name: "Seeing Conditions",
    score: calculateSeeingScore(params.seeingConditions),
    weight: 1.2, // Seeing has significant importance
    description: getSeeingDescription(params.seeingConditions),
    rawValue: params.seeingConditions
  };
  
  const windFactor: SIQSFactor = {
    name: "Wind",
    score: calculateWindScore(params.windSpeed),
    weight: 1.0,
    description: getWindDescription(params.windSpeed),
    rawValue: params.windSpeed
  };
  
  const humidityFactor: SIQSFactor = {
    name: "Humidity",
    score: calculateHumidityScore(params.humidity),
    weight: 0.8,
    description: getHumidityDescription(params.humidity),
    rawValue: params.humidity
  };
  
  const moonFactor: SIQSFactor = {
    name: "Moonlight",
    score: calculateMoonScore(params.moonPhase),
    weight: 1.0,
    description: getMoonDescription(params.moonPhase),
    rawValue: params.moonPhase
  };
  
  // Optional factors based on available data
  const factors: SIQSFactor[] = [
    cloudFactor,
    lightPollutionFactor,
    seeingFactor,
    windFactor,
    humidityFactor,
    moonFactor
  ];
  
  // Add Air Quality if available
  if (params.aqi !== undefined) {
    factors.push({
      name: "Air Quality",
      score: calculateAQIScore(params.aqi),
      weight: 0.5,
      description: getAQIDescription(params.aqi),
      rawValue: params.aqi
    });
  }
  
  // Add Clear Sky Rate if available
  if (params.clearSkyRate !== undefined) {
    factors.push({
      name: "Clear Sky Rate",
      score: calculateClearSkyScore(params.clearSkyRate),
      weight: 0.3,
      description: getClearSkyRateDescription(params.clearSkyRate),
      rawValue: params.clearSkyRate
    });
  }
  
  // Calculate weighted average
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const factor of factors) {
    const weight = factor.weight || 1.0;
    totalWeight += weight;
    weightedSum += factor.score * weight;
  }
  
  // Calculate final score (0-10 scale)
  const finalScore = Math.max(0, Math.min(10, weightedSum / totalWeight));
  
  // Determine if conditions are viable for imaging
  const isViable = finalScore >= 2.0;
  
  // Format the result
  const result: SIQSResult = {
    score: Number(finalScore.toFixed(2)),
    factors: factors,
    timestamp: new Date().toISOString(),
    isViable
  };
  
  return result;
}

// Helper functions for descriptive text
function getCloudDescription(cloudCover: number): string {
  if (cloudCover <= 10) return "Excellent clear skies";
  if (cloudCover <= 30) return "Mostly clear skies";
  if (cloudCover <= 50) return "Partly cloudy";
  if (cloudCover <= 70) return "Mostly cloudy";
  return "Overcast conditions";
}

function getLightPollutionDescription(bortleScale: number): string {
  if (bortleScale <= 2) return "Excellent dark sky";
  if (bortleScale <= 4) return "Good dark sky";
  if (bortleScale <= 6) return "Moderate light pollution";
  if (bortleScale <= 7) return "Considerable light pollution";
  return "Severe light pollution";
}

function getSeeingDescription(seeing: number): string {
  if (seeing <= 1) return "Excellent seeing";
  if (seeing <= 2) return "Good seeing";
  if (seeing <= 3) return "Average seeing";
  if (seeing <= 4) return "Below average seeing";
  return "Poor seeing";
}

function getWindDescription(windSpeed: number): string {
  if (windSpeed <= 5) return "Calm conditions";
  if (windSpeed <= 10) return "Light breeze";
  if (windSpeed <= 20) return "Moderate wind";
  if (windSpeed <= 30) return "Strong wind";
  return "Very windy conditions";
}

function getHumidityDescription(humidity: number): string {
  if (humidity <= 30) return "Very dry air";
  if (humidity <= 50) return "Optimal humidity";
  if (humidity <= 70) return "Moderate humidity";
  if (humidity <= 85) return "High humidity";
  return "Very humid conditions";
}

function getMoonDescription(moonPhase: number): string {
  if (moonPhase <= 0.1) return "New moon (excellent)";
  if (moonPhase <= 0.25) return "Crescent moon";
  if (moonPhase <= 0.5) return "Quarter moon";
  if (moonPhase <= 0.75) return "Gibbous moon";
  if (moonPhase <= 0.9) return "Nearly full moon";
  return "Full moon";
}

function getAQIDescription(aqi: number | undefined): string {
  if (aqi === undefined) return "Air quality data not available";
  if (aqi <= 50) return "Good air quality";
  if (aqi <= 100) return "Moderate air quality";
  if (aqi <= 150) return "Unhealthy for sensitive groups";
  if (aqi <= 200) return "Unhealthy air quality";
  if (aqi <= 300) return "Very unhealthy air quality";
  return "Hazardous air quality";
}

function getClearSkyRateDescription(rate: number | undefined): string {
  if (rate === undefined) return "Clear sky rate data not available";
  if (rate >= 80) return "Excellent clear sky frequency";
  if (rate >= 65) return "Very good clear sky frequency";
  if (rate >= 50) return "Good clear sky frequency";
  if (rate >= 35) return "Moderate clear sky frequency";
  if (rate >= 20) return "Below average clear sky frequency";
  return "Poor clear sky frequency";
}
