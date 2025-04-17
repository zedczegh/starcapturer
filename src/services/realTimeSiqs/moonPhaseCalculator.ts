
import { MoonPhaseInfo } from './siqsTypes';

/**
 * Calculate moon phase for a given date
 * @param date The date to calculate moon phase for
 * @returns Moon phase object with phase value (0-1), illumination percentage, and phase name
 */
export function calculateMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  // Algorithm to calculate moon phase
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Calculate approximate moon phase using simplified algorithm
  let c = 0;
  let e = 0;
  let jd = 0;
  
  if (month < 3) {
    year--;
    month += 12;
  }
  
  ++month;
  c = 365.25 * year;
  e = 30.6 * month;
  jd = c + e + day - 694039.09; // jd is total days elapsed
  jd /= 29.53; // divide by the moon cycle
  
  // Get just the fraction part
  const phase = jd - Math.floor(jd);
  
  // Calculate illumination (0 = new, 1 = full)
  // Use a simple sinusoidal approximation
  const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * phase));
  
  return {
    phase,
    illumination,
    name: getMoonPhaseName(phase),
    date: date.toISOString()
  };
}

/**
 * Get the name of a moon phase based on its numeric value
 * @param phase Moon phase from 0-1 (0 = new, 0.5 = full)
 * @returns Name of the moon phase
 */
export function getMoonPhaseName(phase: number): string {
  if (phase < 0.03 || phase >= 0.97) return "New Moon";
  if (phase < 0.22) return "Waxing Crescent";
  if (phase < 0.28) return "First Quarter";
  if (phase < 0.47) return "Waxing Gibbous";
  if (phase < 0.53) return "Full Moon";
  if (phase < 0.72) return "Waning Gibbous";
  if (phase < 0.78) return "Last Quarter";
  return "Waning Crescent";
}

/**
 * Get the icon name for a moon phase based on its numeric value
 */
export function getMoonPhaseIconName(phase: number): string {
  if (phase < 0.03 || phase >= 0.97) return "moon-new";
  if (phase < 0.22) return "moon-waxing-crescent";
  if (phase < 0.28) return "moon-first-quarter";
  if (phase < 0.47) return "moon-waxing-gibbous";
  if (phase < 0.53) return "moon-full";
  if (phase < 0.72) return "moon-waning-gibbous";
  if (phase < 0.78) return "moon-last-quarter";
  return "moon-waning-crescent";
}

/**
 * Calculate moon rise/set times
 * This is a simplified calculation and not completely accurate
 * @param date The date to calculate for
 * @param latitude The observer's latitude
 * @param longitude The observer's longitude
 * @returns Object with rise and set times as Date objects
 */
export function calculateMoonRiseSet(
  date: Date = new Date(),
  latitude: number,
  longitude: number
): { rise: Date; set: Date } {
  // This is a placeholder for a real calculation
  // For accurate calculations, we'd need a proper astronomical library
  
  // For now, return a dummy result based on the moon phase
  const { phase } = calculateMoonPhase(date);
  
  // Start with noon as the base time
  const baseTime = new Date(date);
  baseTime.setHours(12, 0, 0, 0);
  
  // Moon rises about 50 minutes later each day
  // New moon rises at dawn, full moon rises at sunset
  const riseHourOffset = Math.sin(phase * 2 * Math.PI) * 12;
  const riseTime = new Date(baseTime);
  riseTime.setHours(12 + riseHourOffset, (phase * 50) % 60, 0, 0);
  
  // Moon sets about 12 hours after rising (simplified)
  const setTime = new Date(riseTime);
  setTime.setHours(riseTime.getHours() + 12, riseTime.getMinutes(), 0, 0);
  
  return { rise: riseTime, set: setTime };
}

/**
 * Calculate illumination angle of the moon
 * @param date The date to calculate for
 * @returns Angle in degrees (0-360)
 */
export function calculateMoonIlluminationAngle(date: Date = new Date()): number {
  const { phase } = calculateMoonPhase(date);
  // Convert phase (0-1) to angle (0-360)
  return phase * 360;
}

/**
 * Calculate if the moon is up at a specific time
 */
export function isMoonUp(
  time: Date = new Date(),
  latitude: number,
  longitude: number
): boolean {
  const { rise, set } = calculateMoonRiseSet(time, latitude, longitude);
  
  // Check if the time is between rise and set
  // This doesn't account for cases spanning midnight
  if (rise.getTime() <= set.getTime()) {
    // Normal case: rise then set
    return time >= rise && time <= set;
  } else {
    // Case where rise is after set (spanning midnight)
    return time >= rise || time <= set;
  }
}

/**
 * Estimate moon brightness based on phase and altitude
 */
export function estimateMoonBrightness(
  date: Date = new Date(),
  latitude: number,
  longitude: number
): number {
  const { illumination } = calculateMoonPhase(date);
  
  // If the moon is below the horizon, its brightness is 0
  if (!isMoonUp(date, latitude, longitude)) {
    return 0;
  }
  
  // Scale illumination to a brightness value (0-1)
  // Full moon has much more than linear impact on sky brightness
  return Math.pow(illumination, 0.8);
}
