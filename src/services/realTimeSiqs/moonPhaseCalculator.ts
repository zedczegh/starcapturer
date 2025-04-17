
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

// Export functions
export {
  calculateMoonPhase,
  getMoonInfo
};
