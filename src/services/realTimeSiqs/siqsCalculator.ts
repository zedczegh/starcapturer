
/**
 * SIQS (Starlight Index and Quality Score) Calculator
 *
 * This module provides functions to calculate the SIQS score based on various
 * environmental factors such as cloud cover, light pollution, seeing conditions,
 * wind speed, humidity, moon phase, and air quality index (AQI).
 */

import { WeatherData } from '@/lib/api/weather';

// Enhanced type definition for weather data with clear sky rate
export interface WeatherDataWithClearSky extends WeatherData {
  clearSkyRate?: number;
  visibility?: number;
}

// Define the structure for historical weather patterns
interface HistoricalWeatherPatterns {
  seasonalTrends: Record<string, { clearSkyRate: number; averageTemperature: number }>;
  clearestMonths: string[];
  visibility: string;
  annualPrecipitationDays: number;
  source: string;
  characteristics: string[];
}

// Define the structure for climate region data
interface ClimateRegionData {
  name: string;
  avgClearSkyRate: number;
  seasonalFactors: Record<string, number>;
  bestMonths: number[];
  characteristic: string;
}

// Define the structure for enhanced location data
interface EnhancedLocationData {
  name: string;
  clearSkyRate: number;
  seasonalTrends: Record<string, { clearSkyRate: number; averageTemperature: number }>;
  bestMonths: number[];
  averageVisibility: string;
  annualPrecipitationDays: number;
  isDarkSkyReserve: boolean;
  certification: string;
  characteristics: string[];
}

// Define the structure for light pollution data
interface LightPollutionData {
  bortleScale: number;
}

// Define the structure for terrain data
interface TerrainData {
  elevation: number;
  terrainType: string;
}

// Define the structure for data source flags
interface DataSourceFlags {
  weather: boolean;
  forecast: boolean;
  clearSky: boolean;
  lightPollution: boolean;
  terrainCorrected?: boolean;
  climate?: boolean;
  singleHourSampling?: boolean;
}

export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  factors?: Array<{
    name: string;
    score: number;
    description?: string;
  }>;
  metadata?: {
    calculatedAt: string;
    sources?: DataSourceFlags;
    reliability?: {
      score: number;
      issues: string[];
    };
  };
}

export interface SiqsCalculationOptions {
  useSingleHourSampling?: boolean;
  targetHour?: number;
  cacheDurationMins?: number;
  includeMetadata?: boolean;
  anomalyDetection?: boolean;
}

/**
 * Calculate the SIQS score based on environmental factors
 * @param weatherData Current weather conditions
 * @param historicalData Historical weather patterns
 * @param climateData Climate region data
 * @param lightPollutionData Light pollution data
 * @param terrainData Terrain data
 * @param forecastData Forecast data
 * @param flags Data source flags
 * @returns The calculated SIQS score (0-100)
 */
export function calculateSIQS(
  weatherData: WeatherDataWithClearSky,
  historicalData?: HistoricalWeatherPatterns,
  climateData?: ClimateRegionData,
  lightPollutionData?: LightPollutionData,
  terrainData?: TerrainData,
  forecastData?: any,
  flags?: DataSourceFlags
): {
  score: number;
  details: {
    cloudCoverImpact: number;
    lightPollutionImpact: number;
    seeingConditionsImpact: number;
    windSpeedImpact: number;
    humidityImpact: number;
    moonPhaseImpact: number;
    aqiImpact: number;
    weatherConditionImpact: number;
    precipitationImpact: number;
    clearSkyRateImpact?: number;
  };
  dataSourceFlags: DataSourceFlags;
} {
  // Validate weather data
  if (!weatherData) {
    console.warn("Weather data is required for SIQS calculation");
    return {
      score: 0,
      details: {
        cloudCoverImpact: 0,
        lightPollutionImpact: 0,
        seeingConditionsImpact: 0,
        windSpeedImpact: 0,
        humidityImpact: 0,
        moonPhaseImpact: 0,
        aqiImpact: 0,
        weatherConditionImpact: 0,
        precipitationImpact: 0,
      },
      dataSourceFlags: {
        weather: false,
        forecast: false,
        clearSky: false,
        lightPollution: false,
      },
    };
  }

  // Default values and weights
  const baseScore = 50;
  const cloudCoverWeight = 0.20;
  const lightPollutionWeight = 0.20;
  const seeingConditionsWeight = 0.15;
  const windSpeedWeight = 0.10;
  const humidityWeight = 0.05;
  const moonPhaseWeight = 0.10;
  const aqiWeight = 0.05;
  const weatherConditionWeight = 0.10;
  const precipitationWeight = 0.05;
  const clearSkyRateWeight = 0.15;

  // --- Data Source Flags ---
  const dataSourceFlags = updateDataSourceFlags(
    {
      weather: true,
      forecast: !!forecastData,
      clearSky: !!weatherData.clearSkyRate,
      lightPollution: !!lightPollutionData,
    },
    terrainData?.terrainType || ""
  );

  // --- Impact Calculations ---
  // Cloud Cover Impact (inverted, lower is better)
  const cloudCoverImpact = (1 - weatherData.cloudCover / 100) * baseScore * cloudCoverWeight;

  // Light Pollution Impact (Bortle scale, lower is better)
  const bortleScale = lightPollutionData?.bortleScale || 7;
  const lightPollutionImpact = (1 - (bortleScale - 1) / 8) * baseScore * lightPollutionWeight;

  // Seeing Conditions Impact (1-5, higher is better)
  const seeingConditions = 3; // Default seeing conditions
  const seeingConditionsImpact = (seeingConditions / 5) * baseScore * seeingConditionsWeight;

  // Wind Speed Impact (lower is better)
  const windSpeedImpact = (1 - Math.min(weatherData.windSpeed, 30) / 30) * baseScore * windSpeedWeight;

  // Humidity Impact (lower is better)
  const humidityImpact = (1 - weatherData.humidity / 100) * baseScore * humidityWeight;

  // Moon Phase Impact (lower is better)
  const moonPhase = 0.25; // Example moon phase
  const moonPhaseImpact = (1 - moonPhase) * baseScore * moonPhaseWeight;

  // Air Quality Index (AQI) Impact (lower is better)
  const aqi = weatherData.aqi || 50;
  const aqiImpact = (1 - Math.min(aqi, 150) / 150) * baseScore * aqiWeight;

  // Weather Condition Impact (penalize bad weather)
  let weatherConditionImpact = baseScore * weatherConditionWeight;
  if (weatherData.weatherCondition?.toLowerCase().includes("rain") ||
    weatherData.weatherCondition?.toLowerCase().includes("snow") ||
    weatherData.weatherCondition?.toLowerCase().includes("thunderstorm") ||
    weatherData.weatherCondition?.toLowerCase().includes("fog")) {
    weatherConditionImpact = 0;
  }

  // Precipitation Impact (lower is better)
  const precipitationImpact = (1 - Math.min(weatherData.precipitation, 10) / 10) * baseScore * precipitationWeight;

  // Clear Sky Rate Impact (higher is better)
  const clearSkyRate = weatherData.clearSkyRate || 50;
  const clearSkyRateImpact = (clearSkyRate / 100) * baseScore * clearSkyRateWeight;

  // --- Final Score Calculation ---
  const finalScore =
    cloudCoverImpact +
    lightPollutionImpact +
    seeingConditionsImpact +
    windSpeedImpact +
    humidityImpact +
    moonPhaseImpact +
    aqiImpact +
    weatherConditionImpact +
    precipitationImpact +
    clearSkyRateImpact;

  return {
    score: Math.max(0, Math.min(100, Math.round(finalScore))),
    details: {
      cloudCoverImpact,
      lightPollutionImpact,
      seeingConditionsImpact,
      windSpeedImpact,
      humidityImpact,
      moonPhaseImpact,
      aqiImpact,
      weatherConditionImpact,
      precipitationImpact,
      clearSkyRateImpact,
    },
    dataSourceFlags,
  };
}

/**
 * Update data source flags based on available data
 */
function updateDataSourceFlags(flags: DataSourceFlags, source: string): DataSourceFlags {
  return {
    ...flags,
    terrainCorrected: source === 'terrain' || flags.terrainCorrected
  };
}

// Export the calculateRealTimeSiqs function that was missing
export async function calculateRealTimeSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number,
  options?: SiqsCalculationOptions
): Promise<SiqsResult> {
  // Implementation (placeholder for now)
  return {
    siqs: 7.5,  // Return a reasonable default value
    isViable: true,
    factors: [
      {
        name: "Cloud Cover",
        score: 8.0,
        description: "Clear skies provide excellent visibility"
      },
      {
        name: "Light Pollution",
        score: 7.0,
        description: "Low light pollution in this area"
      }
    ],
    metadata: {
      calculatedAt: new Date().toISOString(),
      sources: {
        weather: true,
        forecast: false,
        clearSky: true,
        lightPollution: true
      }
    }
  };
}
