// SIQS = Stellar Imaging Quality Score

export interface SIQSFactors {
  cloudCover: number;  // percentage 0-100
  bortleScale: number; // 1-9 scale
  seeingConditions: number;  // 1-5 scale (lower is better)
  windSpeed: number;  // mph
  humidity: number;  // percentage 0-100
  moonPhase?: number;  // 0-1 (0=new moon, 0.5=full moon, 1=new moon)
  // New field for night forecast data
  nightForecast?: Array<{
    time: string;
    cloudCover: number;
    windSpeed: number;
    humidity: number;
  }>;
  // New fields for weather conditions
  precipitation?: number; // mm
  weatherCondition?: string; // e.g., "rain", "snow", "haze", "clear"
  aqi?: number; // Air Quality Index (0-500)
}

export interface SIQSFactor {
  name: string;
  score: number;  // 0-100 scale
  description: string;
  weight: number;
}

export interface SIQSResult {
  score: number;  // 0-10 final score
  isViable: boolean;
  factors: {
    name: string;
    score: number; // 0-100 scale
    description: string;
  }[];
}

/**
 * Convert SIQS score to a color code
 * @param score SIQS score from 0-10
 * @param isViable Whether the conditions are viable for astrophotography
 * @returns CSS color string
 */
export function siqsToColor(score: number, isViable: boolean): string {
  if (!isViable) return 'rgb(239, 68, 68)'; // red-500
  if (score >= 8) return 'rgb(34, 197, 94)'; // green-500
  if (score >= 6) return 'rgb(138, 154, 91)'; // brownish green
  if (score >= 4) return 'rgb(250, 204, 21)'; // yellow-500
  if (score >= 2) return 'rgb(249, 115, 22)'; // orange-500
  return 'rgb(239, 68, 68)'; // red-500
}

/**
 * Check if weather conditions make imaging impossible
 * @param cloudCover Cloud cover percentage
 * @param precipitation Precipitation amount
 * @param weatherCondition Weather condition string
 * @returns True if conditions make imaging impossible
 */
function isImagingImpossible(cloudCover: number, precipitation?: number, weatherCondition?: string, aqi?: number): boolean {
  // Per user requirement: if average cloud coverage is over 40%, SIQS should be 0
  if (cloudCover > 40) return true;
  
  // Check for precipitation (rain, snow)
  if (precipitation && precipitation > 0.1) return true;
  
  // Check weather conditions (rain, snow, haze, etc.)
  if (weatherCondition) {
    const badConditions = ['rain', 'drizzle', 'snow', 'sleet', 'hail', 'thunderstorm', 'fog', 'haze', 'mist'];
    for (const condition of badConditions) {
      if (weatherCondition.toLowerCase().includes(condition)) return true;
    }
  }
  
  // Very poor air quality makes imaging impossible
  if (aqi && aqi > 300) return true;
  
  return false;
}

/**
 * Calculate the Stellar Imaging Quality Score based on various factors
 * Takes into account the average conditions throughout the night (until 6am)
 * @param factors Environmental and geographical factors
 * @returns SIQS score from 0-10 (higher is better)
 */
export function calculateSIQS(factors: SIQSFactors): SIQSResult {
  const { 
    cloudCover, 
    bortleScale, 
    seeingConditions, 
    windSpeed, 
    humidity, 
    moonPhase = 0,
    nightForecast = [],
    precipitation = 0,
    weatherCondition = "",
    aqi
  } = factors;
  
  // If we have night forecast data, use it to calculate average conditions
  if (nightForecast.length > 0) {
    // Calculate average values for the night forecast
    const avgCloudCover = nightForecast.reduce((sum, item) => sum + item.cloudCover, 0) / nightForecast.length;
    const avgWindSpeed = nightForecast.reduce((sum, item) => sum + item.windSpeed, 0) / nightForecast.length;
    const avgHumidity = nightForecast.reduce((sum, item) => sum + item.humidity, 0) / nightForecast.length;
    
    // Check if conditions make imaging impossible
    if (isImagingImpossible(avgCloudCover, precipitation, weatherCondition, aqi)) {
      return {
        score: 0,
        isViable: false,
        factors: [
          {
            name: "Weather Conditions",
            score: 0,
            description: "Current conditions make imaging impossible"
          }
        ]
      };
    }
    
    // Calculate individual factor scores (0-100 scale) using the night average values
    const cloudScore = calculateCloudScore(avgCloudCover);
    const lightPollutionScore = calculateLightPollutionScore(bortleScale);
    const seeingScore = calculateSeeingScore(seeingConditions);
    const windScore = calculateWindScore(avgWindSpeed);
    const humidityScore = calculateHumidityScore(avgHumidity);
    const moonScore = calculateMoonScore(moonPhase);
    const aqiScore = aqi ? calculateAQIScore(aqi) : 100;
    
    // Define weights for each factor
    const weights = {
      cloud: 0.30,
      lightPollution: 0.20,
      seeing: 0.15,
      wind: 0.10,
      humidity: 0.10,
      moon: 0.05,
      aqi: 0.10
    };
    
    // Calculate weighted score
    const weightedScore = (
      cloudScore * weights.cloud +
      lightPollutionScore * weights.lightPollution +
      seeingScore * weights.seeing +
      windScore * weights.wind +
      humidityScore * weights.humidity +
      moonScore * weights.moon +
      aqiScore * weights.aqi
    );
    
    // Convert to 0-10 scale
    const finalScore = weightedScore / 10;
    
    // Determine if conditions are viable (SIQS >= 4.0)
    const isViable = finalScore >= 4.0;
    
    const factors = [
      {
        name: "Cloud Cover",
        score: cloudScore,
        description: getCloudDescription(avgCloudCover)
      },
      {
        name: "Light Pollution",
        score: lightPollutionScore,
        description: getLightPollutionDescription(bortleScale)
      },
      {
        name: "Seeing Conditions",
        score: seeingScore,
        description: getSeeingDescription(seeingConditions)
      },
      {
        name: "Wind",
        score: windScore,
        description: getWindDescription(avgWindSpeed)
      },
      {
        name: "Humidity",
        score: humidityScore,
        description: getHumidityDescription(avgHumidity)
      }
    ];
    
    // Add AQI factor if available
    if (aqi !== undefined) {
      factors.push({
        name: "Air Quality",
        score: aqiScore,
        description: getAQIDescription(aqi)
      });
    }
    
    return {
      score: finalScore,
      isViable,
      factors
    };
  } 
  // If no night forecast data, use the current values as before
  else {
    // Check if conditions make imaging impossible
    if (isImagingImpossible(cloudCover, precipitation, weatherCondition, aqi)) {
      return {
        score: 0,
        isViable: false,
        factors: [
          {
            name: "Weather Conditions",
            score: 0,
            description: "Current conditions make imaging impossible"
          }
        ]
      };
    }
    
    // Calculate individual factor scores (0-100 scale)
    const cloudScore = calculateCloudScore(cloudCover);
    const lightPollutionScore = calculateLightPollutionScore(bortleScale);
    const seeingScore = calculateSeeingScore(seeingConditions);
    const windScore = calculateWindScore(windSpeed);
    const humidityScore = calculateHumidityScore(humidity);
    const moonScore = calculateMoonScore(moonPhase);
    const aqiScore = aqi ? calculateAQIScore(aqi) : 100;
    
    // Define weights for each factor
    const weights = {
      cloud: 0.30,
      lightPollution: 0.20,
      seeing: 0.15,
      wind: 0.10,
      humidity: 0.10,
      moon: 0.05,
      aqi: 0.10
    };
    
    // Calculate weighted score
    const weightedScore = (
      cloudScore * weights.cloud +
      lightPollutionScore * weights.lightPollution +
      seeingScore * weights.seeing +
      windScore * weights.wind +
      humidityScore * weights.humidity +
      moonScore * weights.moon +
      aqiScore * weights.aqi
    );
    
    // Convert to 0-10 scale
    const finalScore = weightedScore / 10;
    
    // Determine if conditions are viable (SIQS >= 4.0)
    const isViable = finalScore >= 4.0;
    
    const factors = [
      {
        name: "Cloud Cover",
        score: cloudScore,
        description: getCloudDescription(cloudCover)
      },
      {
        name: "Light Pollution",
        score: lightPollutionScore,
        description: getLightPollutionDescription(bortleScale)
      },
      {
        name: "Seeing Conditions",
        score: seeingScore,
        description: getSeeingDescription(seeingConditions)
      },
      {
        name: "Wind",
        score: windScore,
        description: getWindDescription(windSpeed)
      },
      {
        name: "Humidity",
        score: humidityScore,
        description: getHumidityDescription(humidity)
      }
    ];
    
    // Add AQI factor if available
    if (aqi !== undefined) {
      factors.push({
        name: "Air Quality",
        score: aqiScore,
        description: getAQIDescription(aqi)
      });
    }
    
    return {
      score: finalScore,
      isViable,
      factors
    };
  }
}

// Individual score calculation functions (0-100 scale)
function calculateCloudScore(cloudCover: number): number {
  // If cloud cover is above 40%, score should be 0
  if (cloudCover > 40) return 0;
  
  // Otherwise, linear scale from 0-40%
  return 100 - (cloudCover * 2.5);
}

function calculateLightPollutionScore(bortleScale: number): number {
  // Inverted scale, 100 is dark (bortle 1), 0 is bright (bortle 9)
  return 100 - ((bortleScale - 1) / 8) * 100;
}

function calculateSeeingScore(seeingConditions: number): number {
  // Inverted scale, 100 is perfect (seeing 1), 0 is terrible (seeing 5)
  return 100 - ((seeingConditions - 1) / 4) * 100;
}

function calculateWindScore(windSpeed: number): number {
  // 100 is calm (0 mph), decreases as wind speed increases
  return Math.max(0, 100 - (windSpeed / 30) * 100); // Assuming 30mph is the limit
}

function calculateHumidityScore(humidity: number): number {
  // 100 is dry (0% humidity), decreases as humidity increases
  return 100 - humidity;
}

function calculateMoonScore(moonPhase: number): number {
  // 100 is new moon (0), decreases as moon gets fuller (0.5), back to 100 at new moon (1)
  const moonIllumination = Math.abs(moonPhase - 0.5) * 2; // Scale to 0-1
  return 100 - (moonIllumination * 100);
}

function calculateAQIScore(aqi: number): number {
  // AQI scale: 0-50 (Good), 51-100 (Moderate), 101-150 (Unhealthy for Sensitive Groups), 
  // 151-200 (Unhealthy), 201-300 (Very Unhealthy), 301-500 (Hazardous)
  if (aqi <= 50) return 100;
  if (aqi <= 100) return 80;
  if (aqi <= 150) return 60;
  if (aqi <= 200) return 40;
  if (aqi <= 300) return 20;
  return 0;
}

// Description getter functions
function getCloudDescription(cloudCover: number): string {
  if (cloudCover < 10) return "Excellent clear skies, ideal for all types of astrophotography";
  if (cloudCover < 20) return "Very good conditions with minimal cloud interference";
  if (cloudCover < 30) return "Moderate cloud cover, suitable for bright targets";
  if (cloudCover < 40) return "Significant cloud cover, limiting for many targets";
  return "Heavy cloud cover, unsuitable for imaging";
}

function getLightPollutionDescription(bortleScale: number): string {
  if (bortleScale <= 2) return "Excellent dark sky, Milky Way casts shadows";
  if (bortleScale <= 4) return "Good sky darkness, Milky Way visible with detail";
  if (bortleScale <= 6) return "Moderate light pollution, limited deep-sky visibility";
  if (bortleScale <= 7) return "Significant light pollution, only brighter DSOs visible";
  return "Severe light pollution, limiting to planets and bright stars";
}

function getSeeingDescription(seeingConditions: number): string {
  if (seeingConditions <= 1.5) return "Excellent atmospheric stability for high-resolution imaging";
  if (seeingConditions <= 2.5) return "Good seeing conditions, suitable for planetary detail";
  if (seeingConditions <= 3.5) return "Average seeing, acceptable for most targets";
  if (seeingConditions <= 4.5) return "Poor seeing conditions, challenging for detailed work";
  return "Very poor seeing, significant image degradation";
}

function getWindDescription(windSpeed: number): string {
  if (windSpeed < 5) return "Calm conditions, ideal for all imaging setups";
  if (windSpeed < 10) return "Light breeze, good for most equipment";
  if (windSpeed < 15) return "Moderate wind, may impact long exposures";
  if (windSpeed < 20) return "Strong wind, challenging for many setups";
  return "Very strong wind, unsuitable for most equipment";
}

function getHumidityDescription(humidity: number): string {
  if (humidity < 30) return "Very dry conditions, excellent for optics";
  if (humidity < 50) return "Low humidity, good optical performance";
  if (humidity < 70) return "Moderate humidity, acceptable conditions";
  if (humidity < 85) return "High humidity, potential for dew formation";
  return "Very high humidity, significant dew issues likely";
}

function getAQIDescription(aqi: number): string {
  if (aqi <= 50) return "Good air quality, excellent for imaging";
  if (aqi <= 100) return "Moderate air quality, good for imaging";
  if (aqi <= 150) return "Unhealthy for sensitive groups, acceptable for imaging";
  if (aqi <= 200) return "Unhealthy air quality, reduced clarity";
  if (aqi <= 300) return "Very unhealthy air quality, significant haze";
  return "Hazardous air quality, imaging not recommended";
}
