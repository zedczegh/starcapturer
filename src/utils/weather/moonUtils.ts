import { calculateMoonPhase, calculateMoonriseMoonsetTimes } from '@/services/realTimeSiqs/moonPhaseCalculator';
import type { MoonlessNightInfo } from '@/services/realTimeSiqs/siqsTypes';

/**
 * Calculate moonless night duration based on moonrise and moonset times
 * Enhanced to provide more accurate durations for stargazing windows
 * 
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns MoonlessNightInfo object with duration and timing details
 */
export const calculateMoonlessNightDuration = (latitude: number, longitude: number): MoonlessNightInfo => {
  const moonPhase = calculateMoonPhase();
  // Get moon times
  const { moonrise, moonset } = calculateMoonriseMoonsetTimes(latitude, longitude);
  
  // Parse times with better error handling
  const parseMoonTime = (timeStr: string) => {
    try {
      const now = new Date();
      const [time, period] = timeStr.split(' ');
      
      if (!time) {
        return null; // Invalid time format
      }
      
      let [hours, minutes] = time.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes)) {
        return null; // Invalid time components
      }
      
      if (period && period.toLowerCase() === 'pm' && hours < 12) {
        hours += 12;
      }
      if (period && period.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }
      
      const result = new Date(now);
      result.setHours(hours, minutes, 0, 0);
      return result;
    } catch (error) {
      console.error("Error parsing moon time:", error, timeStr);
      return null;
    }
  };
  
  const moonriseTime = parseMoonTime(moonrise);
  const moonsetTime = parseMoonTime(moonset);
  
  // Handle invalid time cases
  if (!moonriseTime || !moonsetTime) {
    console.warn("Invalid moonrise or moonset times, using phase-based estimate");
    return getPhaseBasedMoonlessNight(moonPhase);
  }
  
  // Adjust dates for moonrise/moonset that might refer to tomorrow or yesterday
  const now = new Date();
  const currentHour = now.getHours();
  
  // If moonset is early morning and current time is evening, it's tomorrow's moonset
  if (moonsetTime.getHours() < 12 && currentHour > 12) {
    moonsetTime.setDate(moonsetTime.getDate() + 1);
  }
  
  // If moonrise is evening and current time is morning, it's today's moonrise
  // If moonrise is morning and current time is evening, it's tomorrow's moonrise
  if (moonriseTime.getHours() >= 12 && currentHour < 12) {
    moonriseTime.setDate(moonriseTime.getDate() - 1);
  } else if (moonriseTime.getHours() < 12 && currentHour > 12) {
    moonriseTime.setDate(moonriseTime.getDate() + 1);
  }
  
  // Standard night period - refined for more accurate astronomical night (8 PM to 6 AM)
  const nightStart = new Date();
  nightStart.setHours(20, 0, 0, 0); // 8 PM
  
  const nightEnd = new Date();
  nightEnd.setHours(6, 0, 0, 0); // 6 AM
  if (nightEnd <= nightStart) {
    nightEnd.setDate(nightEnd.getDate() + 1);
  }
  
  // Calculate moonless period with improved accuracy
  let moonlessStart, moonlessEnd;
  
  // Determine when the moonless period starts
  if (moonsetTime >= nightStart && moonsetTime <= nightEnd) {
    // Moon sets during the night - moonless starts at moonset
    moonlessStart = moonsetTime;
  } else if (moonsetTime < nightStart && (moonriseTime > nightEnd || moonriseTime < nightStart)) {
    // Moon is not in the sky during our night window - entire night is moonless
    moonlessStart = nightStart;
  } else if (moonriseTime > nightStart && moonriseTime < nightEnd) {
    // Moon rises during night - moonless ends at moonrise, starts at night start
    moonlessStart = nightStart;
  } else if (moonsetTime <= nightStart && moonriseTime >= nightStart && moonriseTime <= nightEnd) {
    // Moon already set before night starts, will rise during night
    moonlessStart = nightStart;
  } else {
    // More complex scenarios or moon is up all night - use phase-based estimate
    if (moonPhase < 0.1 || moonPhase > 0.9) {
      // Near new moon - mostly dark
      moonlessStart = nightStart;
    } else if (moonPhase > 0.4 && moonPhase < 0.6) {
      // Near full moon - minimal moonless time
      moonlessStart = new Date(nightEnd);
      moonlessStart.setHours(nightEnd.getHours() - 2);
    } else {
      // Partial moon - reduced duration
      moonlessStart = new Date(nightStart);
      moonlessStart.setHours(nightStart.getHours() + 2);
    }
  }
  
  // Determine when the moonless period ends
  if (moonriseTime > moonlessStart && moonriseTime <= nightEnd) {
    // Moon rises before night ends
    moonlessEnd = moonriseTime;
  } else {
    // No moonrise during remaining night
    moonlessEnd = nightEnd;
  }
  
  // Calculate duration in hours with 1 decimal accuracy
  const durationMs = moonlessEnd.getTime() - moonlessStart.getTime();
  const durationHours = Math.max(0.5, durationMs / (1000 * 60 * 60)); // At least 0.5 hour
  
  // Format times for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Days until new moon
  const daysUntilNewMoon = calculateDaysUntilNewMoon(moonPhase);
  
  return {
    duration: Math.round(durationHours * 10) / 10, // Round to 1 decimal
    startTime: formatTime(moonlessStart),
    endTime: formatTime(moonlessEnd),
    moonrise: moonrise,
    moonset: moonset,
    nextNewMoon: formatNextNewMoonDate(daysUntilNewMoon),
    daysUntilNewMoon
  };
};

/**
 * Calculate days until next new moon
 */
export const calculateDaysUntilNewMoon = (phase: number): number => {
  // Calculate days until next new moon (phase = 0)
  // One lunar cycle is 29.53059 days
  const daysUntilNewMoon = phase * 29.53059;
  return Math.round(daysUntilNewMoon);
};

/**
 * Format the next new moon date
 */
export const formatNextNewMoonDate = (daysToAdd: number): string => {
  const now = new Date();
  const newMoonDate = new Date(now);
  newMoonDate.setDate(newMoonDate.getDate() + daysToAdd);
  return newMoonDate.toLocaleDateString();
};

/**
 * Get phase-based moonless night estimate when precise times are not available
 */
const getPhaseBasedMoonlessNight = (moonPhase: number): MoonlessNightInfo => {
  // Default night period
  const nightStart = new Date();
  nightStart.setHours(20, 0, 0, 0); // 8 PM
  
  const nightEnd = new Date();
  nightEnd.setHours(6, 0, 0, 0); // 6 AM
  if (nightEnd <= nightStart) {
    nightEnd.setDate(nightEnd.getDate() + 1);
  }
  
  // Default format function
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Adjust moonless duration based on moon phase
  let moonlessStart = new Date(nightStart);
  let moonlessEnd = new Date(nightEnd);
  let moonlessHours = 10; // Default for full night
  
  if (moonPhase > 0.4 && moonPhase < 0.6) {
    // Near full moon - minimal moonless time (2 hours)
    moonlessStart = new Date(nightEnd);
    moonlessStart.setHours(nightEnd.getHours() - 2);
    moonlessHours = 2;
  } else if (moonPhase >= 0.25 && moonPhase <= 0.75) {
    // Half moon - partial moonless time (5 hours)
    moonlessStart = new Date(nightStart);
    moonlessStart.setHours(nightStart.getHours() + 2);
    moonlessStart.setMinutes(30);
    moonlessHours = 5.5;
  } else if (moonPhase < 0.1 || moonPhase > 0.9) {
    // Near new moon - mostly dark (full night)
    // Keep default values
  } else {
    // Crescent moon - good moonless time (8 hours)
    moonlessStart = new Date(nightStart);
    moonlessStart.setHours(nightStart.getHours() + 1);
    moonlessHours = 8;
  }
  
  // Days until new moon
  const daysUntilNewMoon = calculateDaysUntilNewMoon(moonPhase);
  
  return {
    duration: moonlessHours,
    startTime: formatTime(moonlessStart),
    endTime: formatTime(moonlessEnd),
    moonrise: 'Unknown',
    moonset: 'Unknown',
    nextNewMoon: formatNextNewMoonDate(daysUntilNewMoon),
    daysUntilNewMoon
  };
};

/**
 * Calculate moon's effect on stargazing quality
 * @param moonPhase Moon phase (0-1)
 * @param moonAltitude Moon's altitude in degrees (negative if below horizon)
 * @returns Impact score (0-10, where 0 is no impact, 10 is severe impact)
 */
export const calculateMoonImpact = (moonPhase: number, moonAltitude: number): number => {
  // Moon below horizon has no impact
  if (moonAltitude < 0) return 0;
  
  // Calculate base impact based on phase (full moon = max impact)
  // Adjust phase to be 0 at new moon, 1 at full moon, and 0 again at next new moon
  const adjustedPhase = moonPhase <= 0.5 ? moonPhase * 2 : (1 - moonPhase) * 2;
  const phaseImpact = adjustedPhase * 10;
  
  // Altitude impact (higher moon = more impact)
  const altitudeImpact = Math.min(10, moonAltitude / 9); // Max impact at 90 degrees
  
  // Combined impact with weighted factors
  // Phase has 70% influence, altitude has 30%
  const combinedImpact = (phaseImpact * 0.7) + (altitudeImpact * 0.3);
  
  return Math.min(10, Math.max(0, combinedImpact));
};
