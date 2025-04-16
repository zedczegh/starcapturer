import { SunCalc } from 'suncalc';

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
 */
export function calculateMoonriseMoonsetTimes(latitude: number, longitude: number, date = new Date()) {
  try {
    // Use SunCalc library to calculate moon times
    const moonTimes = SunCalc.getMoonTimes(date, latitude, longitude);
    
    // Format times for display
    const formatTime = (time: Date | undefined) => {
      if (!time) return "Unknown";
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    return {
      moonrise: formatTime(moonTimes.rise),
      moonset: formatTime(moonTimes.set)
    };
  } catch (error) {
    console.error("Error calculating moon times:", error);
    return {
      moonrise: "Unknown",
      moonset: "Unknown"
    };
  }
}

// Function to determine if the date is in winter
export function isWinterSeason(date = new Date()): boolean {
  const month = date.getMonth();
  const hemisphere = determineHemisphere();
  
  // Northern hemisphere: winter is months 11-1 (Dec-Feb)
  // Southern hemisphere: winter is months 5-7 (Jun-Aug)
  let winterMonths;
  
  if (hemisphere === 'northern') {
    winterMonths = [11, 0, 1]; // Dec, Jan, Feb
  } else {
    winterMonths = [5, 6, 7]; // Jun, Jul, Aug
  }
  
  return winterMonths.includes(month);
}

// Replace the function that was attempting to modify isWinter constant
export function getMoonInfo(date = new Date()): { isGoodForAstronomy: boolean; name: string } {
  const phase = calculateMoonPhase(date);
  const winterSeason = isWinterSeason(date);
  
  // Get the moon phase name
  const name = getMoonPhaseNameByPhase(phase);
  
  // Moon is good for astronomy when it's near new moon
  // This is generally when the phase is < 0.15 or > 0.85
  const isGoodForAstronomy = phase < 0.15 || phase > 0.85 || 
    // In winter, criteria can be slightly more forgiving due to longer nights
    (winterSeason && (phase < 0.2 || phase > 0.8));
  
  return { isGoodForAstronomy, name };
}

// Helper function to determine hemisphere based on current location
function determineHemisphere(): 'northern' | 'southern' {
  try {
    // Try to get user's location if available
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      // Default to northern hemisphere
      return 'northern';
    }
  } catch (e) {
    console.error("Error determining hemisphere:", e);
  }
  
  // Default to northern hemisphere
  return 'northern';
}

/**
 * Calculate the moon's illumination percentage
 */
export function calculateMoonIllumination(date = new Date()): number {
  const phase = calculateMoonPhase(date);
  
  // Convert phase (0-1) to illumination percentage
  // At phase 0 and 1, illumination is 0%
  // At phase 0.5, illumination is 100%
  let illumination;
  
  if (phase <= 0.5) {
    // Waxing from 0% to 100%
    illumination = phase * 2;
  } else {
    // Waning from 100% to 0%
    illumination = (1 - phase) * 2;
  }
  
  // Convert to percentage
  return Math.round(illumination * 100);
}

/**
 * Calculate the moon's altitude in degrees
 */
export function calculateMoonAltitude(latitude: number, longitude: number, date = new Date()): number {
  try {
    // Use SunCalc to get moon position
    const moonPosition = SunCalc.getMoonPosition(date, latitude, longitude);
    
    // Convert altitude from radians to degrees
    const altitudeDegrees = moonPosition.altitude * (180 / Math.PI);
    
    return Math.round(altitudeDegrees * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    console.error("Error calculating moon altitude:", error);
    return 0;
  }
}

/**
 * Get the next full moon date
 */
export function getNextFullMoonDate(date = new Date()): Date {
  const phase = calculateMoonPhase(date);
  
  // Calculate days until next full moon (phase = 0.5)
  let daysUntilFullMoon;
  
  if (phase <= 0.5) {
    // Moon is waxing towards full
    daysUntilFullMoon = (0.5 - phase) * 29.53059;
  } else {
    // Moon is waning, calculate days until next full moon
    daysUntilFullMoon = (1.5 - phase) * 29.53059;
  }
  
  // Create date for next full moon
  const nextFullMoon = new Date(date);
  nextFullMoon.setDate(date.getDate() + Math.round(daysUntilFullMoon));
  
  return nextFullMoon;
}

/**
 * Get the next new moon date
 */
export function getNextNewMoonDate(date = new Date()): Date {
  const phase = calculateMoonPhase(date);
  
  // Calculate days until next new moon (phase = 0)
  const daysUntilNewMoon = (1 - phase) * 29.53059;
  
  // Create date for next new moon
  const nextNewMoon = new Date(date);
  nextNewMoon.setDate(date.getDate() + Math.round(daysUntilNewMoon));
  
  return nextNewMoon;
}
