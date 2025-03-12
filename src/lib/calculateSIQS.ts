// SIQS = Stellar Imaging Quality Score

export interface SIQSFactors {
  cloudCover: number;  // percentage 0-100
  bortleScale: number; // 1-9 scale
  seeingConditions: number;  // 1-5 scale (lower is better)
  windSpeed: number;  // mph
  humidity: number;  // percentage 0-100
  moonPhase?: number;  // 0-1 (0=new moon, 0.5=full moon, 1=new moon)
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
 * Calculate the Stellar Imaging Quality Score based on various factors
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
    moonPhase = 0 
  } = factors;
  
  // Calculate individual factor scores (0-100 scale)
  const cloudScore = calculateCloudScore(cloudCover);
  const lightPollutionScore = calculateLightPollutionScore(bortleScale);
  const seeingScore = calculateSeeingScore(seeingConditions);
  const windScore = calculateWindScore(windSpeed);
  const humidityScore = calculateHumidityScore(humidity);
  const moonScore = calculateMoonScore(moonPhase);
  
  // Define weights for each factor
  const weights = {
    cloud: 0.35,
    lightPollution: 0.25,
    seeing: 0.15,
    wind: 0.1,
    humidity: 0.1,
    moon: 0.05
  };
  
  // Calculate weighted score
  const weightedScore = (
    cloudScore * weights.cloud +
    lightPollutionScore * weights.lightPollution +
    seeingScore * weights.seeing +
    windScore * weights.wind +
    humidityScore * weights.humidity +
    moonScore * weights.moon
  );
  
  // Convert to 0-10 scale
  const finalScore = weightedScore / 10;
  
  // Determine if conditions are viable (SIQS >= 4.0)
  const isViable = finalScore >= 4.0;
  
  return {
    score: finalScore,
    isViable,
    factors: [
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
    ]
  };
}

// Individual score calculation functions (0-100 scale)
function calculateCloudScore(cloudCover: number): number {
  // Inverted scale, 100 is clear, 0 is fully cloudy
  return 100 - cloudCover;
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

// Description getter functions
function getCloudDescription(cloudCover: number): string {
  if (cloudCover < 10) return "Excellent clear skies, ideal for all types of astrophotography";
  if (cloudCover < 20) return "Very good conditions with minimal cloud interference";
  if (cloudCover < 40) return "Moderate cloud cover, suitable for bright targets";
  if (cloudCover < 60) return "Significant cloud cover, limiting for many targets";
  if (cloudCover < 80) return "Heavy cloud cover, poor conditions for most imaging";
  return "Very heavy cloud cover, unsuitable for imaging";
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
