import { ClimateRegion, WeatherDataWithClearSky } from './siqsTypes';
import { calculateMoonPhase } from './moonPhaseCalculator';

/**
 * Adjust a score based on climate region
 */
export function adjustForClimate(
  score: number, 
  factor: 'cloudCover' | 'humidity' | 'temperature', 
  region: ClimateRegion
): number {
  if (!region || !region.adjustmentFactors) {
    return score;
  }
  
  let adjustmentIndex = 0;
  if (factor === 'humidity') adjustmentIndex = 1;
  if (factor === 'temperature') adjustmentIndex = 2;
  
  const adjustment = region.adjustmentFactors[adjustmentIndex] || 1.0;
  
  // Apply adjustment, but keep within 0-10 range
  return Math.min(10, Math.max(0, score * adjustment));
}

/**
 * Adjust score for time of day/year
 */
export function adjustForTime(
  score: number,
  latitude: number,
  longitude: number,
  date: Date = new Date()
): number {
  // Get current hour in local time
  const hour = date.getHours();
  
  // Night hours (10pm - 4am) get a bonus
  if (hour >= 22 || hour <= 4) {
    return Math.min(10, score * 1.1);
  }
  
  // Early morning/late evening (4am-7am, 7pm-10pm) are good too
  if ((hour > 4 && hour <= 7) || (hour >= 19 && hour < 22)) {
    return Math.min(10, score * 1.05);
  }
  
  // Adjust for season
  const month = date.getMonth() + 1; // 1-12
  
  // Northern hemisphere winter or southern hemisphere summer
  if ((latitude > 0 && (month <= 2 || month >= 11)) || 
      (latitude <= 0 && (month >= 5 && month <= 8))) {
    return Math.min(10, score * 1.05);
  }
  
  return score;
}

/**
 * Adjust score based on light pollution (Bortle scale)
 */
export function adjustForLight(score: number, bortleScale: number): number {
  if (!bortleScale || bortleScale < 1 || bortleScale > 9) {
    bortleScale = 5; // Default to suburban sky
  }
  
  // Bortle 1 (excellent dark sky) gets full score
  if (bortleScale <= 1) return score;
  
  // For Bortle 2-9, reduce score progressively
  // Bortle 9 (inner city) maxes out at ~60% of original score
  const lightPollutionFactor = 1 - ((bortleScale - 1) / 20);
  
  return score * lightPollutionFactor;
}

/**
 * Adjust score based on moon phase
 */
export function adjustForMoon(score: number, date: Date = new Date()): number {
  const moonPhase = calculateMoonPhase(date);
  
  // New moon (phase 0 or 1): no adjustment
  if (moonPhase < 0.05 || moonPhase > 0.95) {
    return score;
  }
  
  // Full moon (phase ~0.5): maximum reduction
  if (moonPhase > 0.45 && moonPhase < 0.55) {
    return score * 0.7; // 30% reduction
  }
  
  // Quarter moons: moderate reduction
  if ((moonPhase > 0.2 && moonPhase < 0.3) || (moonPhase > 0.7 && moonPhase < 0.8)) {
    return score * 0.85; // 15% reduction
  }
  
  // Crescent moons: slight reduction
  return score * 0.9; // 10% reduction
}
