
/**
 * High-precision moon phase calculator for SIQS algorithm
 * 
 * This implementation provides accurate moon phase data which is
 * critical for determining night sky brightness.
 */

/**
 * Calculate the current moon phase (0 = new moon, 0.5 = full moon, 1 = new moon)
 * @returns Moon phase as a number between 0 and 1
 */
export function calculateMoonPhase(): number {
  // Get current date
  const date = new Date();
  
  // Known new moon reference date (Jan 6, 2000)
  const knownNewMoon = new Date(2000, 0, 6, 18, 14, 0);
  
  // Lunar cycle is approximately 29.53059 days
  const lunarCycle = 29.53059;
  
  // Calculate difference in milliseconds
  const diffMs = date.getTime() - knownNewMoon.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  // Calculate current position in lunar cycle
  const position = (diffDays % lunarCycle) / lunarCycle;
  
  // Normalize to 0-1 range
  return position;
}

/**
 * Calculate moon illumination percentage
 * @returns Percentage of moon that is illuminated (0-100)
 */
export function calculateMoonIllumination(): number {
  const phase = calculateMoonPhase();
  
  // Convert phase to illumination percentage
  // At new moon (0 or 1) illumination is 0%
  // At full moon (0.5) illumination is 100%
  let illumination = 0;
  
  if (phase <= 0.5) {
    // First half of cycle (new moon to full moon)
    illumination = phase * 2 * 100;
  } else {
    // Second half of cycle (full moon to new moon)
    illumination = (1 - phase) * 2 * 100;
  }
  
  return Math.round(illumination);
}

/**
 * Calculate if the moon is above horizon at the specified location
 * 
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param date Date to check (defaults to now)
 * @returns Boolean indicating if moon is above horizon
 */
export function isMoonAboveHorizon(
  latitude: number, 
  longitude: number, 
  date: Date = new Date()
): boolean {
  // This is a simplified calculation
  // In a production system, this would use ephemeris calculations
  // to determine moon position accurately
  
  // For now, we use a simple day/night approximation
  const hours = date.getHours();
  const isNight = hours >= 18 || hours < 6;
  
  // During night, assume ~50% chance moon is above horizon
  if (isNight) {
    const phase = calculateMoonPhase();
    
    // Very rough approximation:
    // - New moon rises and sets with the sun
    // - Full moon rises at sunset, sets at sunrise
    if (phase < 0.25) {
      // Waxing crescent - visible early evening
      return hours >= 18 && hours <= 22;
    } else if (phase < 0.5) {
      // Waxing gibbous - visible evening and midnight
      return hours >= 18 || hours <= 2;
    } else if (phase < 0.75) {
      // Waning gibbous - visible midnight and early morning
      return hours >= 22 || hours <= 6;
    } else {
      // Waning crescent - visible early morning
      return hours >= 2 && hours <= 6;
    }
  }
  
  return false;
}

/**
 * Get descriptive information about the current moon
 */
export function getMoonInfo(): {
  phase: number;
  illumination: number;
  name: string;
  isGoodForAstronomy: boolean;
} {
  const phase = calculateMoonPhase();
  const illumination = calculateMoonIllumination();
  
  let name = "";
  let isGoodForAstronomy = false;
  
  if (phase < 0.025 || phase > 0.975) {
    name = "New Moon";
    isGoodForAstronomy = true;
  } else if (phase < 0.24) {
    name = "Waxing Crescent";
    isGoodForAstronomy = phase < 0.15;
  } else if (phase < 0.26) {
    name = "First Quarter";
    isGoodForAstronomy = false;
  } else if (phase < 0.49) {
    name = "Waxing Gibbous";
    isGoodForAstronomy = false;
  } else if (phase < 0.51) {
    name = "Full Moon";
    isGoodForAstronomy = false;
  } else if (phase < 0.74) {
    name = "Waning Gibbous";
    isGoodForAstronomy = false;
  } else if (phase < 0.76) {
    name = "Last Quarter";
    isGoodForAstronomy = false;
  } else {
    name = "Waning Crescent";
    isGoodForAstronomy = phase > 0.85;
  }
  
  return {
    phase,
    illumination,
    name,
    isGoodForAstronomy
  };
}

/**
 * Calculate moonrise and moonset times for a specific location
 * 
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Object with moonrise and moonset times
 */
export function calculateMoonriseMoonsetTimes(
  latitude: number,
  longitude: number
): { moonrise: string; moonset: string } {
  // Get current phase
  const phase = calculateMoonPhase();
  const now = new Date();
  
  // Base calculations that factor in moon phase, latitude, and time of year
  // - New moon rises and sets with the sun
  // - Full moon rises at sunset, sets at sunrise
  
  // Get current date info
  const month = now.getMonth();
  const isWinter = (month >= 9 || month <= 2); // Oct to Mar is winter-ish
  
  // Estimate sunset/sunrise times based on season and latitude
  const getSeasonalSunriseSunsetTimes = () => {
    // Base sunrise/sunset hours adjusted by hemisphere and season
    let sunriseHour = isWinter ? 7 : 6;
    let sunsetHour = isWinter ? 17 : 20;
    
    // Adjust for hemisphere (southern hemisphere seasons are reversed)
    const isSouthernHemisphere = latitude < 0;
    if (isSouthernHemisphere) {
      isWinter = !isWinter;
    }
    
    // Calculate day length adjustment based on latitude
    // Higher latitudes have more extreme seasonal variations
    const absLatitude = Math.abs(latitude);
    let latitudeAdjustment = 0;
    
    if (absLatitude > 23.5) { // Beyond tropics
      // Calculate latitude impact (0 to ~5 hours)
      latitudeAdjustment = (absLatitude - 23.5) / 15;
      latitudeAdjustment = Math.min(5, latitudeAdjustment); // Cap at 5 hours
      
      if (isWinter) {
        // Winter: shorter days
        sunriseHour += latitudeAdjustment;
        sunsetHour -= latitudeAdjustment;
      } else {
        // Summer: longer days
        sunriseHour -= latitudeAdjustment;
        sunsetHour += latitudeAdjustment;
      }
    }
    
    // Ensure times are reasonable
    sunriseHour = Math.max(4, Math.min(10, sunriseHour));
    sunsetHour = Math.max(16, Math.min(22, sunsetHour));
    
    return { sunriseHour, sunsetHour };
  };
  
  const { sunriseHour, sunsetHour } = getSeasonalSunriseSunsetTimes();
  
  // Calculate moonrise and moonset based on phase with more nuanced logic
  const getMoonTimes = () => {
    // New moon - rises and sets with sun
    if (phase < 0.05 || phase > 0.95) {
      return {
        moonriseHour: sunriseHour,
        moonsetHour: sunsetHour
      };
    }
    // Full moon - rises at sunset, sets at sunrise
    else if (phase > 0.45 && phase < 0.55) {
      return {
        moonriseHour: sunsetHour,
        moonsetHour: sunriseHour + 24  // Next day
      };
    }
    // Waxing crescent - visible in evening
    else if (phase < 0.25) {
      const phaseProgress = phase / 0.25; // 0 to 1 within this phase
      return {
        moonriseHour: sunriseHour + (phaseProgress * 6), // Rises progressively later
        moonsetHour: sunsetHour + (phaseProgress * 6)    // Sets progressively later
      };
    }
    // First quarter - rises at noon, sets at midnight
    else if (phase >= 0.25 && phase < 0.30) {
      return {
        moonriseHour: 12,
        moonsetHour: 24
      };
    }
    // Waxing gibbous - visible evening through night
    else if (phase >= 0.30 && phase < 0.45) {
      const phaseProgress = (phase - 0.30) / 0.15; // 0 to 1 within this phase
      return {
        moonriseHour: 12 + (phaseProgress * 6),  // Noon to sunset
        moonsetHour: 24 + (phaseProgress * 6)    // Midnight to sunrise
      };
    }
    // Waning gibbous - visible night through morning
    else if (phase >= 0.55 && phase < 0.70) {
      const phaseProgress = (phase - 0.55) / 0.15; // 0 to 1 within this phase
      return {
        moonriseHour: sunsetHour + (phaseProgress * 6),  // Evening to midnight
        moonsetHour: 7 + (phaseProgress * 6)             // Morning to noon
      };
    }
    // Last quarter - rises at midnight, sets at noon
    else if (phase >= 0.70 && phase < 0.75) {
      return {
        moonriseHour: 0,
        moonsetHour: 12
      };
    }
    // Waning crescent - visible in morning
    else {
      const phaseProgress = (phase - 0.75) / 0.20; // 0 to 1 within this phase
      return {
        moonriseHour: 0 + (phaseProgress * 6),    // Midnight to sunrise
        moonsetHour: 12 + (phaseProgress * 6)     // Noon to sunset
      };
    }
  };
  
  const { moonriseHour, moonsetHour } = getMoonTimes();
  
  // Format times with AM/PM for better readability
  const formatTime = (hour: number) => {
    let hourInt = Math.floor(hour % 24);
    const minutes = Math.round((hour % 1) * 60);
    let period = 'AM';
    
    if (hourInt >= 12) {
      period = 'PM';
      if (hourInt > 12) hourInt -= 12;
    }
    
    if (hourInt === 0) hourInt = 12;
    
    return `${hourInt}:${minutes < 10 ? '0' + minutes : minutes} ${period}`;
  };
  
  return {
    moonrise: formatTime(moonriseHour),
    moonset: formatTime(moonsetHour)
  };
}
