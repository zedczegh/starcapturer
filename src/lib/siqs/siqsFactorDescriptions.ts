
import { LightPollutionLevel } from './types';

/**
 * Create detailed factor descriptions for UI display
 */
export function createFactorDescriptions(validatedData: any): any[] {
  return [
    {
      name: "Cloud Cover",
      score: validatedData.cloudScore,
      description: `${validatedData.effectiveCloudCover}% cloud cover, ${
        validatedData.effectiveCloudCover < 20 ? 'excellent for observation' :
        validatedData.effectiveCloudCover < 40 ? 'good for observation' :
        validatedData.effectiveCloudCover < 70 ? 'fair for observation' :
        'poor for observation'
      }`
    },
    {
      name: "Light Pollution",
      score: validatedData.lightPollutionScore,
      description: `Bortle scale ${validatedData.bortleScale}, ${
        validatedData.bortleScale <= 3 ? 'dark sky' :
        validatedData.bortleScale <= 5 ? 'moderate light pollution' :
        'significant light pollution'
      }`
    },
    {
      name: "Seeing Conditions",
      score: validatedData.seeingScore,
      description: `Level ${validatedData.seeingConditions} seeing, ${
        validatedData.seeingConditions <= 2 ? 'excellent stability' :
        validatedData.seeingConditions <= 3 ? 'average stability' :
        'poor stability'
      }`
    },
    {
      name: "Wind",
      score: validatedData.windScore,
      description: `${validatedData.windSpeed} km/h wind, ${
        validatedData.windSpeed < 10 ? 'good for imaging' :
        validatedData.windSpeed < 20 ? 'acceptable for imaging' :
        'challenging for imaging'
      }`
    },
    {
      name: "Humidity",
      score: validatedData.humidityScore,
      description: `${validatedData.humidity}% humidity, ${
        validatedData.humidity < 50 ? 'ideal for optics' :
        validatedData.humidity < 75 ? 'acceptable for optics' :
        'risk of dew formation'
      }`
    },
    {
      name: "Moon Phase",
      score: validatedData.moonScore,
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
      score: validatedData.aqiScore,
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
}

/**
 * Add clear sky factor if available
 */
export function addClearSkyFactor(factors: any[], validatedData: any, clearSkyScore?: number): any[] {
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
  return factors;
}

/**
 * Determine SIQS quality level
 */
export function determineSiqsLevel(score: number): LightPollutionLevel {
  return score >= 7.0 ? 'excellent' :
         score >= 5.0 ? 'good' :
         score >= 3.0 ? 'fair' : 'poor';
}
