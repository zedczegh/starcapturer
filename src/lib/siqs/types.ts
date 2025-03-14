
// SIQS = Stellar Imaging Quality Score

export interface SIQSFactors {
  cloudCover: number;  // percentage 0-100
  bortleScale: number; // 1-9 scale
  seeingConditions: number;  // 1-5 scale (lower is better)
  windSpeed: number;  // mph
  humidity: number;  // percentage 0-100
  moonPhase?: number;  // 0-1 (0=new moon, 0.5=full moon, 1=new moon)
  // Night forecast data
  nightForecast?: Array<{
    time: string;
    cloudCover: number;
    windSpeed: number;
    humidity: number;
  }>;
  // Weather conditions
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
