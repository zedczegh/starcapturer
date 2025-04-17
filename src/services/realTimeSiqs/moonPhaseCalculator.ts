
/**
 * Moon phase calculation utilities
 */

export interface MoonPhaseInfo {
  phase: number;
  name: string;
  illumination: number;
  age: number;
  emoji: string;
  isFullMoon: boolean;
  isNewMoon: boolean;
}

/**
 * Calculate the current moon phase
 */
export function calculateMoonPhase(date?: Date): MoonPhaseInfo {
  // Use current date if not provided
  const current = date || new Date();
  
  // Get year, month, and day
  let year = current.getFullYear();
  let month = current.getMonth() + 1; // JavaScript months are 0-based
  let day = current.getDate();
  
  // Adjust month for moon phase calculation algorithm
  if (month < 3) {
    year--;
    month += 12;
  }
  
  // Calculate approximate moon phase using algorithm
  const c = 365.25 * year;
  const e = 30.6 * month;
  const jd = c + e + day - 694039.09; // Julian day
  const moonPhase = jd / 29.53; // Divide by moon cycle length
  const fraction = moonPhase - Math.floor(moonPhase); // Get fractional part
  const phase = Math.round(fraction * 29.53); // Convert to moon age in days
  
  // Calculate illumination percentage (simple approximation)
  const illumination = Math.cos(Math.PI * (phase / 29.53 - 0.5)) * 0.5 + 0.5;
  
  // Get moon phase name and emoji based on phase
  const { name, emoji, isFullMoon, isNewMoon } = getMoonPhaseName(phase);
  
  return {
    phase: phase,
    name,
    illumination: Math.round(illumination * 100) / 100,
    age: Math.round(phase * 10) / 10,
    emoji,
    isFullMoon,
    isNewMoon
  };
}

/**
 * Get moon phase name based on lunar day
 */
export function getMoonPhaseName(phase: number): { 
  name: string; 
  emoji: string;
  isFullMoon: boolean;
  isNewMoon: boolean;
} {
  // Define moon phases
  if (phase >= 0 && phase < 1) {
    return { name: "New Moon", emoji: "🌑", isNewMoon: true, isFullMoon: false };
  } else if (phase >= 1 && phase < 6.5) {
    return { name: "Waxing Crescent", emoji: "🌒", isNewMoon: false, isFullMoon: false };
  } else if (phase >= 6.5 && phase < 8.5) {
    return { name: "First Quarter", emoji: "🌓", isNewMoon: false, isFullMoon: false };
  } else if (phase >= 8.5 && phase < 13.5) {
    return { name: "Waxing Gibbous", emoji: "🌔", isNewMoon: false, isFullMoon: false };
  } else if (phase >= 13.5 && phase < 15.5) {
    return { name: "Full Moon", emoji: "🌕", isNewMoon: false, isFullMoon: true };
  } else if (phase >= 15.5 && phase < 20.5) {
    return { name: "Waning Gibbous", emoji: "🌖", isNewMoon: false, isFullMoon: false };
  } else if (phase >= 20.5 && phase < 22.5) {
    return { name: "Last Quarter", emoji: "🌗", isNewMoon: false, isFullMoon: false };
  } else {
    return { name: "Waning Crescent", emoji: "🌘", isNewMoon: false, isFullMoon: false };
  }
}

/**
 * Get moon info for a specific date
 */
export function getMoonInfo(date?: Date): MoonPhaseInfo {
  return calculateMoonPhase(date);
}
