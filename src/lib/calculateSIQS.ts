
/**
 * Enhanced SIQS calculation with protection against algorithm tampering
 * This implementation uses protected factors and validation
 */
import { protectedFactors, calculateWeightedScore } from './siqs/protectedFactors';
import { LightPollutionLevel, SIQSResult } from './siqs/types';

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
  isViable: boolean; // Added this property to fix the type error
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
  const validatedData = {
    cloudCover: typeof data.cloudCover === 'number' ? data.cloudCover : 50,
    bortleScale: typeof data.bortleScale === 'number' ? data.bortleScale : 5,
    seeingConditions: typeof data.seeingConditions === 'number' ? data.seeingConditions : 3,
    windSpeed: typeof data.windSpeed === 'number' ? data.windSpeed : 10,
    humidity: typeof data.humidity === 'number' ? data.humidity : 50,
    moonPhase: typeof data.moonPhase === 'number' ? data.moonPhase : 0.5,
    precipitation: typeof data.precipitation === 'number' ? data.precipitation : 0,
    aqi: typeof data.aqi === 'number' ? data.aqi : undefined,
    clearSkyRate: typeof data.clearSkyRate === 'number' ? data.clearSkyRate : undefined
  };

  // Adjust cloud cover for precipitation
  let effectiveCloudCover = validatedData.cloudCover;
  if (validatedData.precipitation && validatedData.precipitation > 0) {
    // Precipitation implies clouds
    effectiveCloudCover = Math.max(validatedData.cloudCover, 70);
    
    // Heavy precipitation makes conditions even worse
    if (validatedData.precipitation > 5) {
      effectiveCloudCover = Math.max(effectiveCloudCover, 90);
    }
  }
  
  // Weather condition can also override cloud cover
  if (data.weatherCondition) {
    const badConditions = [
      'rain', 'storm', 'thunder', 'snow', 'sleet', 'hail', 'fog'
    ];
    
    if (badConditions.some(cond => 
      data.weatherCondition?.toLowerCase().includes(cond))) {
      effectiveCloudCover = Math.max(effectiveCloudCover, 80);
    }
  }
  
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
  const level: LightPollutionLevel = 
    finalScore >= 7.0 ? 'excellent' :
    finalScore >= 5.0 ? 'good' :
    finalScore >= 3.0 ? 'fair' : 'poor';
  
  // Create factor descriptions for UI display
  const factors = [
    {
      name: "Cloud Cover",
      score: cloudScore,
      description: `${effectiveCloudCover}% cloud cover, ${
        effectiveCloudCover < 20 ? 'excellent for observation' :
        effectiveCloudCover < 40 ? 'good for observation' :
        effectiveCloudCover < 70 ? 'fair for observation' :
        'poor for observation'
      }`
    },
    {
      name: "Light Pollution",
      score: lightPollutionScore,
      description: `Bortle scale ${validatedData.bortleScale}, ${
        validatedData.bortleScale <= 3 ? 'dark sky' :
        validatedData.bortleScale <= 5 ? 'moderate light pollution' :
        'significant light pollution'
      }`
    },
    {
      name: "Seeing Conditions",
      score: seeingScore,
      description: `Level ${validatedData.seeingConditions} seeing, ${
        validatedData.seeingConditions <= 2 ? 'excellent stability' :
        validatedData.seeingConditions <= 3 ? 'average stability' :
        'poor stability'
      }`
    },
    {
      name: "Wind",
      score: windScore,
      description: `${validatedData.windSpeed} km/h wind, ${
        validatedData.windSpeed < 10 ? 'good for imaging' :
        validatedData.windSpeed < 20 ? 'acceptable for imaging' :
        'challenging for imaging'
      }`
    },
    {
      name: "Humidity",
      score: humidityScore,
      description: `${validatedData.humidity}% humidity, ${
        validatedData.humidity < 50 ? 'ideal for optics' :
        validatedData.humidity < 75 ? 'acceptable for optics' :
        'risk of dew formation'
      }`
    },
    {
      name: "Moon Phase",
      score: moonScore,
      description: `${
        validatedData.moonPhase < 0.1 ? 'New moon' :
        validatedData.moonPhase < 0.25 ? 'Crescent moon' :
        validatedData.moonPhase < 0.5 ? 'Quarter moon' :
        validatedData.moonPhase < 0.75 ? 'Gibbous moon' :
        validatedData.moonPhase < 0.9 ? 'Nearly full moon' :
        'Full moon'
      } (${Math.round(validatedData.moonPhase * 100)}% illuminated)`
    },
    {
      name: "Air Quality",
      score: aqiScore,
      description: validatedData.aqi !== undefined ?
        `AQI: ${validatedData.aqi}, ${
          validatedData.aqi < 50 ? 'good air quality' :
          validatedData.aqi < 100 ? 'moderate air quality' :
          validatedData.aqi < 150 ? 'unhealthy for sensitive groups' :
          'unhealthy air quality'
        }` :
        'Estimated air quality'
    }
  ];
  
  // Add clear sky factor if available
  if (validatedData.clearSkyRate !== undefined && clearSkyScore !== undefined) {
    factors.push({
      name: "Clear Sky Rate",
      score: clearSkyScore,
      description: `Annual clear sky rate: ${validatedData.clearSkyRate}%, ${
        validatedData.clearSkyRate > 70 ? 'excellent location' :
        validatedData.clearSkyRate > 50 ? 'good location' :
        validatedData.clearSkyRate > 30 ? 'average location' :
        'challenging location'
      }`
    });
  }
  
  // Determine if conditions are viable for astrophotography
  const isViable = finalScore >= 5.0; // Consider viable if score is at least 5.0
  
  return {
    score: finalScore,
    factors,
    level,
    isViable
  };
}
