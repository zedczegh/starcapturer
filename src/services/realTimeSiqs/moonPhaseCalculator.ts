
import * as SunCalc from 'suncalc';
import { MoonPhaseInfo } from './siqsTypes';

/**
 * Calculate the current moon phase (0-1)
 * 0 = New Moon, 0.5 = Full Moon, 1 = New Moon
 */
export function calculateMoonPhase(date = new Date()): number {
  // Algorithm to calculate moon phase
  // Returns a value between 0 and 1
  
  // Use Julian date calculation for accuracy
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-based
  const day = date.getDate();
  
  // Calculate Julian date
  let jd = 367 * year - Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4) +
    Math.floor(275 * month / 9) + day + 1721013.5;
  
  // Add time of day
  jd += (date.getUTCHours() - 12) / 24 + date.getUTCMinutes() / 1440 + date.getUTCSeconds() / 86400;
  
  // Calculate moon phase using Julian date
  // 29.53059 days per lunar cycle
  const moonCycle = 29.53059;
  const refJd = 2451550.1; // New moon reference (Jan 6, 2000)
  const phase = (jd - refJd) % moonCycle;
  
  // Normalize to 0-1
  return phase / moonCycle;
}

/**
 * Get the name of the moon phase based on the phase value
 */
export function getMoonPhaseNameByPhase(phase: number): string {
  // Normalize phase to 0-1 range
  const normalizedPhase = phase % 1;
  
  // Determine moon phase name
  if (normalizedPhase < 0.025 || normalizedPhase >= 0.975) {
    return "New Moon";
  } else if (normalizedPhase < 0.25) {
    return "Waxing Crescent";
  } else if (normalizedPhase < 0.275) {
    return "First Quarter";
  } else if (normalizedPhase < 0.475) {
    return "Waxing Gibbous";
  } else if (normalizedPhase < 0.525) {
    return "Full Moon";
  } else if (normalizedPhase < 0.725) {
    return "Waning Gibbous";
  } else if (normalizedPhase < 0.775) {
    return "Last Quarter";
  } else {
    return "Waning Crescent";
  }
}

/**
 * Calculate moonrise and moonset times for a specific location
 * Enhanced version with better error handling and fallbacks
 */
export function calculateMoonriseMoonsetTimes(latitude: number, longitude: number, date = new Date()) {
  try {
    // Use SunCalc library to calculate moon times
    const moonTimes = SunCalc.getMoonTimes(date, latitude, longitude);
    
    // In some locations/dates, moonrise or moonset might not happen
    const moonrise = moonTimes.rise ? 
      moonTimes.rise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
      "Unknown";
      
    const moonset = moonTimes.set ? 
      moonTimes.set.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
      "Unknown";
    
    return { moonrise, moonset };
  } catch (error) {
    console.error("Error calculating moon times:", error);
    return { moonrise: "Unknown", moonset: "Unknown" };
  }
}

/**
 * Get detailed information about the current moon phase
 * Includes phase name, illumination percentage, and if it's good for astronomy
 */
export function getMoonInfo(): MoonPhaseInfo {
  const phase = calculateMoonPhase();
  const name = getMoonPhaseNameByPhase(phase);
  const illumination = Math.abs(0.5 - phase) * 2; // 0 at new/full, 1 at quarter
  
  // Calculate if this is a good phase for astronomy (new moon or close to it)
  const isNew = phase < 0.05 || phase > 0.95;
  const isFull = phase > 0.45 && phase < 0.55;
  const isGoodForAstronomy = phase < 0.25 || phase > 0.75;
  
  return {
    phase,
    name,
    illumination,
    isNew,
    isFull,
    isGoodForAstronomy
  };
}

/**
 * Calculate the next new moon date
 */
export function getNextNewMoonDate(): Date {
  const today = new Date();
  const currentPhase = calculateMoonPhase(today);
  
  // Calculate days until next new moon (phase = 0)
  // One lunar cycle is 29.53059 days
  const daysUntilNewMoon = (1 - currentPhase) * 29.53059;
  
  // Calculate the date of the next new moon
  const nextNewMoon = new Date(today);
  nextNewMoon.setDate(today.getDate() + Math.round(daysUntilNewMoon));
  
  return nextNewMoon;
}
