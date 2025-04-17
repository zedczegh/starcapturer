
/**
 * Calculate moon phase and its impact on sky conditions
 */

/**
 * Get the current moon phase
 * @returns Moon phase value between 0 and 1
 */
export function getMoonPhase(date: Date = new Date()): number {
  // Simple algorithm to calculate moon phase
  const year = date.getFullYear();
  let month = date.getMonth() + 1; // JavaScript months are 0-based
  const day = date.getDate();
  
  // Adjust for January and February
  if (month < 3) {
    month += 12;
    // Use let to fix the reassignment error
    const adjustedYear = year - 1;
    // Calculate moon phase with adjusted values
    return calculateMoonPhase(adjustedYear, month, day);
  }
  
  return calculateMoonPhase(year, month, day);
}

function calculateMoonPhase(year: number, month: number, day: number): number {
  // Algorithm from "Astronomical Algorithms" by Jean Meeus
  // This is simplified for our needs
  
  const c = Math.floor(year / 100);
  const g = 15 + c - Math.floor(c / 4) - Math.floor((8 * c + 13) / 25);
  const j = day + ((153 * month - 457) / 5) + 365 * year + Math.floor(year / 4) - g;
  
  // Normalized moon phase from 0 to 1
  return (j % 29.53) / 29.53;
}

/**
 * Get the name of the current moon phase
 */
export function getMoonPhaseName(phase: number = getMoonPhase()): string {
  if (phase < 0.025 || phase >= 0.975) return "New Moon";
  if (phase < 0.25) return "Waxing Crescent";
  if (phase < 0.275) return "First Quarter";
  if (phase < 0.475) return "Waxing Gibbous";
  if (phase < 0.525) return "Full Moon";
  if (phase < 0.725) return "Waning Gibbous";
  if (phase < 0.775) return "Last Quarter";
  return "Waning Crescent";
}

/**
 * Calculate impact of moon on visibility
 * @returns Value between 0 and 1, where 0 is best (no moon) and 1 is worst (full moon)
 */
export function calculateMoonVisibilityImpact(phase: number = getMoonPhase()): number {
  // Full moon has the most impact
  if (phase > 0.475 && phase < 0.525) return 1;
  
  // New moon has the least impact
  if (phase < 0.025 || phase > 0.975) return 0;
  
  // Calculate impact based on phase distance from full moon
  const distanceFromFull = Math.abs(0.5 - phase);
  const normalizedImpact = 1 - (distanceFromFull * 2);
  
  return normalizedImpact;
}

/**
 * Get current moon information including phase and impact
 */
export function getMoonInfo(): { phase: number; name: string; impact: number } {
  const phase = getMoonPhase();
  return {
    phase,
    name: getMoonPhaseName(phase),
    impact: calculateMoonVisibilityImpact(phase)
  };
}
