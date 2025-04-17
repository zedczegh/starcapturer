
/**
 * Moon phase calculation utilities
 */

// Calculate the moon phase (0-1) for a given date
export function calculateMoonPhase(date = new Date()): number {
  // Use the date provided or current date
  const now = date;
  
  // Convert to UTC
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // JavaScript months are 0-11
  const day = now.getUTCDate();
  
  // Calculation for moon phase based on the date
  let c = 0;
  let e = 0;
  
  if (month <= 2) {
    const y = year - 1;
    c = 365.25 * y;
    e = 30.6 * (month + 12);
  } else {
    c = 365.25 * year;
    e = 30.6 * month;
  }
  
  // Days since known new moon (January 6, 2000)
  const jd = c + e + day - 694039.09; 
  
  // Divide by the moon cycle (29.53 days)
  const moonPhase = jd / 29.53; 
  
  // Get the fractional part
  const phase = moonPhase - Math.floor(moonPhase);
  
  return phase;
}

// Get detailed moon information
export function getMoonInfo(date = new Date(), latitude = 0, longitude = 0): any {
  const moonPhase = calculateMoonPhase(date);
  
  // Calculate moon illumination (simplified)
  const illumination = moonPhase < 0.5 
    ? moonPhase * 2 
    : (1 - moonPhase) * 2;
  
  return {
    phase: moonPhase,
    illumination: illumination,
    // Add more moon information as needed
    isNewMoon: moonPhase < 0.05 || moonPhase > 0.95,
    isFullMoon: moonPhase > 0.45 && moonPhase < 0.55,
    percentIlluminated: Math.round(illumination * 100)
  };
}

// Add this function for the DynamicMoonIcon component
export function getMoonPhaseNameByPhase(phase: number): string {
  if (phase < 0.05 || phase > 0.95) return "new";
  if (phase < 0.20) return "waxing-crescent";
  if (phase < 0.30) return "first-quarter";
  if (phase < 0.45) return "waxing-gibbous";
  if (phase < 0.55) return "full";
  if (phase < 0.70) return "waning-gibbous";
  if (phase < 0.80) return "third-quarter";
  if (phase < 0.95) return "waning-crescent";
  return "new";
}

// Additional moon functions
export function calculateMoonriseMoonsetTimes(date: Date, latitude: number, longitude: number): any {
  // Simplified implementation
  return {
    moonrise: new Date(date.setHours(18, 0, 0, 0)), // Placeholder
    moonset: new Date(date.setHours(6, 0, 0, 0))    // Placeholder
  };
}

export function getNextNewMoonDate(currentDate: Date = new Date()): Date {
  // Simplified implementation - find the next new moon
  const currentPhase = calculateMoonPhase(currentDate);
  const daysToNewMoon = (1 - currentPhase) * 29.53;
  const nextNewMoon = new Date(currentDate);
  nextNewMoon.setDate(currentDate.getDate() + Math.round(daysToNewMoon));
  return nextNewMoon;
}
