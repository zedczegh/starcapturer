
/**
 * @license
 * SIQS Algorithm - Copyright (c) 2023-2025 StarCapturer
 * This file contains proprietary algorithms and is protected by intellectual property laws.
 * Unauthorized reproduction, modification or distribution is strictly prohibited.
 */

import { calculateCloudScore, calculateLightPollutionScore, calculateSeeingScore, 
  calculateWindScore, calculateHumidityScore, calculateMoonScore, 
  calculateAQIScore, calculateClearSkyScore, normalizeScore } from './factors';

// SIQS algorithm weights - these are carefully researched and calibrated values
const WEIGHTS = {
  cloud: 0.27,
  lightPollution: 0.18,
  seeing: 0.14, 
  wind: 0.09,
  humidity: 0.09,
  moon: 0.05,
  aqi: 0.08,
  clearSky: 0.10
};

// Object.freeze prevents modification of the weights object
Object.freeze(WEIGHTS);

/**
 * Protected SIQS calculation with input validation
 * @param weatherData Weather data for calculation
 * @param bortleScale Light pollution scale
 * @param seeingConditions Atmospheric seeing conditions
 * @param moonPhase Current moon phase
 * @returns SIQS score normalized to 0-10 scale
 */
export function calculateProtectedSiqs(
  weatherData: {
    cloudCover: number;
    humidity?: number;
    windSpeed?: number;
    clearSkyRate?: number;
    aqi?: number;
  },
  bortleScale: number,
  seeingConditions: number,
  moonPhase: number
): number {
  // Input validation to prevent algorithm errors
  if (!weatherData || typeof weatherData !== 'object') {
    console.error('Invalid weather data provided to SIQS algorithm');
    return 0;
  }

  if (typeof bortleScale !== 'number' || bortleScale < 1 || bortleScale > 9) {
    bortleScale = 5; // Default fallback value
  }

  if (typeof seeingConditions !== 'number' || seeingConditions < 1 || seeingConditions > 5) {
    seeingConditions = 3; // Default fallback value
  }

  if (typeof moonPhase !== 'number' || moonPhase < 0 || moonPhase > 1) {
    moonPhase = 0.5; // Default fallback value
  }

  // Calculate individual factor scores (0-100 scale)
  const cloudScore = calculateCloudScore(weatherData.cloudCover);
  const lightPollutionScore = calculateLightPollutionScore(bortleScale);
  const seeingScore = calculateSeeingScore(seeingConditions);
  const windScore = calculateWindScore(weatherData.windSpeed || 10);
  const humidityScore = calculateHumidityScore(weatherData.humidity || 50);
  const moonScore = calculateMoonScore(moonPhase);
  const aqiScore = calculateAQIScore(weatherData.aqi || 50);
  const clearSkyScore = calculateClearSkyScore(weatherData.clearSkyRate || 50);

  // Calculate weighted score using immutable weights
  const weightedScore = 
    cloudScore * WEIGHTS.cloud +
    lightPollutionScore * WEIGHTS.lightPollution +
    seeingScore * WEIGHTS.seeing +
    windScore * WEIGHTS.wind +
    humidityScore * WEIGHTS.humidity +
    moonScore * WEIGHTS.moon +
    aqiScore * WEIGHTS.aqi +
    clearSkyScore * WEIGHTS.clearSky;

  // Convert to 0-10 scale and round to 1 decimal place
  const finalScore = Math.round((weightedScore / 10) * 10) / 10;
  
  // Ensure score is within valid range
  return Math.max(0, Math.min(10, finalScore));
}

// Create a proxy to intercept and protect calculation requests
export const siqsAlgorithm = {
  calculate: calculateProtectedSiqs
};

// Prevent direct modification of the algorithm object
Object.freeze(siqsAlgorithm);
