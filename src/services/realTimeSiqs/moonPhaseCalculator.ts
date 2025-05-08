
/**
 * Moon phase calculation utilities
 */
import { MoonPhaseInfo } from './siqsTypes';

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
