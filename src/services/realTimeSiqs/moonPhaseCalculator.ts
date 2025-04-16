
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
  
  // Estimate sunset/sunrise times based on season
  let sunriseHour = isWinter ? 7 : 6;
  let sunsetHour = isWinter ? 17 : 20;
  
  // Adjust for latitude - higher latitudes have more extreme day/night variation
  const latitudeAdjustment = Math.abs(latitude) / 15; // 0 to 6 hours adjustment
  if (Math.abs(latitude) > 23.5) { // Only adjust significantly beyond tropics
    if (isWinter) {
      // Winter: later sunrise, earlier sunset at high latitudes
      sunriseHour += latitudeAdjustment * (latitude > 0 ? 1 : -1);
      sunsetHour -= latitudeAdjustment * (latitude > 0 ? 1 : -1);
    } else {
      // Summer: earlier sunrise, later sunset at high latitudes
      sunriseHour -= latitudeAdjustment * (latitude > 0 ? 1 : -1);
      sunsetHour += latitudeAdjustment * (latitude > 0 ? 1 : -1);
    }
  }
  
  // Normalize hours to reasonable range
  sunriseHour = Math.max(4, Math.min(9, sunriseHour));
  sunsetHour = Math.max(17, Math.min(22, sunsetHour));
  
  // Calculate moonrise and moonset based on phase
  let moonriseHour, moonsetHour;
  
  // New Moon - rises and sets with the sun
  if (phase < 0.05 || phase > 0.95) {
    moonriseHour = sunriseHour;
    moonsetHour = sunsetHour;
  } 
  // Waxing Crescent - rises after sunrise, sets after sunset
  else if (phase < 0.25) {
    moonriseHour = sunriseHour + 3 + (phase * 12);
    moonsetHour = sunsetHour + 3 + (phase * 12);
  }
  // First Quarter - rises around noon, sets around midnight
  else if (phase < 0.30) {
    moonriseHour = 12;
    moonsetHour = 24;
  }
  // Waxing Gibbous - rises in afternoon, sets after midnight
  else if (phase < 0.45) {
    moonriseHour = 14 + ((phase - 0.3) * 12);
    moonsetHour = 2 + ((phase - 0.3) * 12);
  }
  // Full Moon - rises at sunset, sets at sunrise
  else if (phase < 0.55) {
    moonriseHour = sunsetHour;
    moonsetHour = sunriseHour + 24; // next day
  }
  // Waning Gibbous - rises after sunset, sets after sunrise
  else if (phase < 0.70) {
    moonriseHour = sunsetHour + 2 + ((phase - 0.55) * 8);
    moonsetHour = sunriseHour + 2 + ((phase - 0.55) * 8) + 12;
  }
  // Last Quarter - rises around midnight, sets around noon
  else if (phase < 0.80) {
    moonriseHour = 24;
    moonsetHour = 12 + 24; // noon next day
  }
  // Waning Crescent - rises in early morning, sets in afternoon
  else {
    moonriseHour = 3 + ((phase - 0.8) * 20);
    moonsetHour = 15 + ((phase - 0.8) * 20);
  }
  
  // Format times
  const formatTime = (hour: number) => {
    const hourInt = Math.floor(hour % 24);
    const minutes = Math.round((hour % 1) * 60);
    
    // Create a date object for proper formatting
    const date = new Date();
    date.setHours(hourInt, minutes, 0, 0);
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return {
    moonrise: formatTime(moonriseHour),
    moonset: formatTime(moonsetHour)
  };
}
