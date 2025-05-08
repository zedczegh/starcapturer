/**
 * Core SIQS (Simulated Imaging Quality Score) calculation service
 */
import { WeatherDataWithClearSky, SiqsResult, SiqsCalculationOptions } from './siqsTypes';
import { fetchWeatherData } from './weatherService';
import { calculateSeeingCondition } from './seeingCalculator';
import { calculateLightPollutionScore } from './lightPollutionCalculator';
import { applyIntelligentAdjustments } from './siqsAdjustments';
import { getClearSkyRate } from './clearSkyService';
import { getTerrainCorrectionFactor } from './terrainCorrectionService';
import { getClimateRegion } from './climateService';
import { getHistoricalClearSkyData } from './historicalDataService';
import { enhancedLocationData } from './enhancedLocationDataService';
import { logInfo, logError } from '@/utils/debug/errorLogger';

/**
 * Calculate the Real-Time Simulated Imaging Quality Score (SIQS)
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param bortleScale Bortle scale value (1-9)
 * @param options Calculation options
 * @returns SIQS result object
 */
export async function calculateRealTimeSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number = 4,
  options: SiqsCalculationOptions = {}
): Promise<SiqsResult> {
  const startTime = Date.now();
  
  // Validate inputs
  if (!latitude || !longitude) {
    throw new Error('Latitude and longitude are required');
  }
  
  // Default values
  const useSingleHourSampling = options.useSingleHourSampling || false;
  const targetHour = options.targetHour || 1;
  const includeMetadata = options.includeMetadata || false;
  
  // Fetch weather data
  let weatherData: WeatherDataWithClearSky;
  try {
    weatherData = await fetchWeatherData(latitude, longitude, useSingleHourSampling, targetHour);
  } catch (error: any) {
    logError('Error fetching weather data:', error);
    return {
      siqs: 0,
      isViable: false,
      factors: [{ name: 'Weather Data Unavailable', score: 0, description: 'Failed to retrieve weather information' }]
    };
  }
  
  // Calculate seeing condition
  const seeingCondition = calculateSeeingCondition(weatherData.temperature, weatherData.windSpeed);
  
  // Calculate light pollution score
  const lightPollutionScore = calculateLightPollutionScore(bortleScale);
  
  // Base SIQS calculation
  let siqsScore = (
    (10 - weatherData.cloudCover / 10) +
    (10 - weatherData.humidity / 10) +
    seeingCondition +
    lightPollutionScore
  ) / 4;
  
  // Get clear sky rate
  let clearSkyData: any = null;
  try {
    clearSkyData = await getClearSkyRate(latitude, longitude);
  } catch (error: any) {
    logError('Error getting clear sky rate:', error);
  }
  
  // Get terrain correction factor
  let terrainCorrectionFactor: number | null = null;
  try {
    terrainCorrectionFactor = await getTerrainCorrectionFactor(latitude, longitude);
    if (terrainCorrectionFactor !== null) {
      siqsScore *= terrainCorrectionFactor;
      logInfo(`Applied terrain correction factor: ${terrainCorrectionFactor.toFixed(2)}`);
    }
  } catch (error: any) {
    logError('Error getting terrain correction factor:', error);
  }

  try {
    const enhancedData = enhancedLocationData(latitude, longitude, weatherData);
    // Use enhancedData here
  } catch (error) {
    console.error("Error getting enhanced location data:", error);
  }

  try {
    const region = getClimateRegion(latitude, longitude);
    // Use region here
  } catch (error) {
    console.error("Error determining climate region:", error);
  }
  
  // Apply intelligent adjustments
  siqsScore = applyIntelligentAdjustments(siqsScore, weatherData, clearSkyData, bortleScale);
  
  // Get historical clear sky data
  if (options.useHistoricalData) {
    try {
      const historicalData = await getHistoricalClearSkyData(latitude, longitude);
      if (historicalData && historicalData.averageClearSkyRate) {
        const historicalBonus = Math.min(1.1, 1 + (historicalData.averageClearSkyRate - 50) / 500);
        siqsScore *= historicalBonus;
        logInfo(`Applied historical clear sky bonus: ${historicalBonus.toFixed(2)}`);
      }
    } catch (error: any) {
      logError('Error getting historical clear sky data:', error);
    }
  }
  
  // Cap the SIQS score between 0 and 10
  siqsScore = Math.max(0, Math.min(10, siqsScore));
  
  const endTime = Date.now();
  const calculationTime = (endTime - startTime) / 1000;
  logInfo(`SIQS calculation completed in ${calculationTime.toFixed(2)} seconds`);
  
  const siqsResult: SiqsResult = {
    siqs: siqsScore,
    isViable: siqsScore > 5,
    factors: [
      { name: 'Cloud Cover', score: 10 - weatherData.cloudCover / 10, description: `Cloud cover: ${weatherData.cloudCover}%` },
      { name: 'Humidity', score: 10 - weatherData.humidity / 10, description: `Humidity: ${weatherData.humidity}%` },
      { name: 'Seeing Condition', score: seeingCondition, description: `Seeing condition: ${seeingCondition.toFixed(1)}` },
      { name: 'Light Pollution', score: lightPollutionScore, description: `Light pollution: ${lightPollutionScore.toFixed(1)}` }
    ],
    weatherData: weatherData,
    forecastData: weatherData._forecast,
    metadata: includeMetadata ? {
      calculatedAt: new Date().toISOString(),
      sources: {
        weather: true,
        forecast: !!weatherData._forecast,
        clearSky: !!clearSkyData,
        lightPollution: true,
        terrainCorrected: terrainCorrectionFactor !== null,
        climate: true,
        historicalData: options.useHistoricalData || false,
        singleHourSampling: useSingleHourSampling
      },
      algorithm: {
        version: '1.0',
        adjustments: [
          'Intelligent adjustments based on weather conditions and location',
          'Clear sky rate bonus',
          'Terrain correction factor',
          'Historical clear sky data bonus'
        ]
      },
      reliability: {
        score: 9,
        issues: []
      }
    } : undefined
  };
  
  return siqsResult;
}
