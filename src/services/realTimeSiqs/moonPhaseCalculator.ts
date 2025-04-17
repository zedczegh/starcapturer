
/**
 * Moon phase calculations for astronomical applications
 */

// Moon phase names
const MOON_PHASES = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent"
];

/**
 * Calculate current moon phase (0-1)
 * 0 = New Moon, 0.5 = Full Moon, 0.99 = Almost New Moon again
 */
export function calculateMoonPhase(date = new Date()): number {
  // Julian date algorithm
  let year = date.getFullYear();
  let month = date.getMonth() + 1; // JS months are 0-11
  const day = date.getDate();
  
  // Adjust for January and February
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  
  // Calculate Julian date
  const a = Math.floor(year / 100);
  const b = Math.floor(a / 4);
  const c = 2 - a + b;
  const e = 365.25 * (year + 4716);
  const f = 30.6001 * (month + 1);
  const julianDate = c + day + e + f - 1524.5;
  
  // Days since new moon on Jan 6, 2000
  const daysSinceNew = julianDate - 2451549.5;
  const newMoons = daysSinceNew / 29.53;
  
  // Get just the fractional part
  const phase = newMoons % 1;
  
  // Normalize to 0-1 range
  return phase < 0 ? phase + 1 : phase;
}

/**
 * Get moon phase name based on phase value
 * @param phase Moon phase (0-1)
 * @returns Name of the moon phase
 */
export function getMoonPhaseName(phase: number): string {
  // Convert phase to 0-8 scale (8 = same as 0)
  const phaseIndex = Math.round(phase * 8) % 8;
  return MOON_PHASES[phaseIndex];
}

/**
 * Get information about the current moon
 * @returns Object with moon phase and name
 */
export function getMoonInfo(date = new Date()) {
  const phase = calculateMoonPhase(date);
  const name = getMoonPhaseName(phase);
  
  return {
    phase,
    name,
    illumination: calculateMoonIllumination(phase)
  };
}

/**
 * Calculate moon illumination percentage based on phase
 * @param phase Moon phase (0-1)
 * @returns Illumination percentage (0-100)
 */
function calculateMoonIllumination(phase: number): number {
  // Model the moon illumination as a sinusoidal function
  // Full moon (phase=0.5) is 100% illuminated
  // New moon (phase=0 or 1) is 0% illuminated
  return 100 * (1 - Math.cos(2 * Math.PI * phase)) / 2;
}
