
/**
 * Moon phase calculation utilities
 */
import { MoonPhaseInfo, MoonlessNightInfo } from './siqsTypes';
import SunCalc from 'suncalc';

/**
 * Calculate the current moon phase
 * @returns Moon phase value between 0-1 (0 = new moon, 0.5 = full moon, 1 = new moon)
 */
export function calculateMoonPhase(): number {
  // This is a simplified calculation - a more accurate one would use astronomical formulas
  const date = new Date();
  const synodic = 29.53059; // Synodic month in days (time between new moons)
  
  // January 6, 2000 was a new moon
  const refDate = new Date(2000, 0, 6);
  const diff = date.getTime() - refDate.getTime();
  const diffDays = diff / (1000 * 60 * 60 * 24);
  const phase = (diffDays % synodic) / synodic;
  
  return phase;
}

/**
 * Get detailed moon phase information
 * @returns Moon phase info object with phase, illumination, and name
 */
export function getMoonPhaseInfo(): MoonPhaseInfo {
  const phase = calculateMoonPhase();
  
  // Calculate illumination (0 = new moon, 1 = full moon, 0 = new moon)
  // Illumination follows a cosine curve
  const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
  
  let name = '';
  let isNew = false;
  let isFull = false;
  let isWaxing = phase < 0.5;
  let isWaning = !isWaxing;
  
  // Determine moon phase name
  if (phase < 0.03 || phase > 0.97) {
    name = 'New Moon';
    isNew = true;
  } else if (phase < 0.22) {
    name = 'Waxing Crescent';
  } else if (phase < 0.28) {
    name = 'First Quarter';
  } else if (phase < 0.47) {
    name = 'Waxing Gibbous';
  } else if (phase < 0.53) {
    name = 'Full Moon';
    isFull = true;
  } else if (phase < 0.72) {
    name = 'Waning Gibbous';
  } else if (phase < 0.78) {
    name = 'Last Quarter';
  } else {
    name = 'Waning Crescent';
  }
  
  return {
    phase,
    illumination,
    name,
    isNew,
    isFull,
    isWaxing,
    isWaning
  };
}

/**
 * Get moon phase information for astronomy
 * @returns Moon phase info with phase, illumination, name, and astronomy suitability
 */
export function getMoonInfo(): MoonPhaseInfo & { isGoodForAstronomy: boolean } {
  const info = getMoonPhaseInfo();
  const isGoodForAstronomy = info.isNew || 
    info.name === 'Waxing Crescent' || 
    info.name === 'Waning Crescent';
  
  return {
    ...info,
    isGoodForAstronomy
  };
}

/**
 * Get moon phase name from phase value
 * @param phase Moon phase value (0-1)
 * @returns Moon phase name
 */
export function getMoonPhaseNameByPhase(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

/**
 * Calculate moonrise and moonset times for a specific location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param date Optional date (defaults to current date)
 * @returns Object with moonrise and moonset times
 */
export function calculateMoonriseMoonsetTimes(
  latitude: number, 
  longitude: number, 
  date: Date = new Date()
): { moonrise: string; moonset: string } {
  try {
    // Use SunCalc to get moonrise and moonset times
    const moonTimes = SunCalc.getMoonTimes(date, latitude, longitude);
    
    // Format times
    const formatTime = (time: Date | undefined) => {
      if (!time) return 'Unknown';
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    return {
      moonrise: formatTime(moonTimes.rise),
      moonset: formatTime(moonTimes.set)
    };
  } catch (error) {
    console.error('Error calculating moon times:', error);
    return {
      moonrise: 'Unknown',
      moonset: 'Unknown'
    };
  }
}

/**
 * Get the date of the next new moon
 * @param fromDate Optional starting date (defaults to current date)
 * @returns Date of the next new moon
 */
export function getNextNewMoonDate(fromDate: Date = new Date()): Date {
  const currentPhase = calculateMoonPhase();
  const daysUntilNextNewMoon = (1 - currentPhase) * 29.53059;
  
  const nextNewMoon = new Date(fromDate);
  nextNewMoon.setDate(fromDate.getDate() + Math.ceil(daysUntilNextNewMoon));
  
  return nextNewMoon;
}

