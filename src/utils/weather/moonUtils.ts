
import { calculateMoonPhase, calculateMoonriseMoonsetTimes } from '@/services/realTimeSiqs/moonPhaseCalculator';
import type { MoonlessNightInfo } from '@/services/realTimeSiqs/siqsTypes';

/**
 * Calculate moonless night duration based on moonrise and moonset times
 * Enhanced to provide more accurate durations for stargazing windows globally
 * 
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns MoonlessNightInfo object with duration and timing details
 */
export const calculateMoonlessNightDuration = (latitude: number, longitude: number): MoonlessNightInfo => {
  const moonPhase = calculateMoonPhase();
  
  // Get moon times with improved calculator that handles all latitudes
  const { moonrise, moonset } = calculateMoonriseMoonsetTimes(latitude, longitude);
  
  // Parse times with better error handling for all global time formats
  const parseMoonTime = (timeStr: string) => {
    try {
      if (!timeStr || timeStr === 'Unknown') {
        return null; // Invalid time string
      }

      const now = new Date();
      
      // Handle different time formats globally (12h/24h)
      let hours = 0;
      let minutes = 0;
      let isPM = false;
      
      // Extract time components with regex to handle various formats
      const timeMatch = timeStr.match(/(\d{1,2})[:.'](\d{1,2})?\s*(am|pm|AM|PM)?/);
      
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        isPM = timeMatch[3] && (timeMatch[3].toLowerCase() === 'pm');
      } else {
        // Try 24-hour format
        const time24Match = timeStr.match(/(\d{1,2})[:.'](\d{1,2})?/);
        if (time24Match) {
          hours = parseInt(time24Match[1], 10);
          minutes = time24Match[2] ? parseInt(time24Match[2], 10) : 0;
          // Assume 24h format if no AM/PM
        } else {
          return null; // Could not parse time
        }
      }
      
      // Convert 12h to 24h if needed
      if (isPM && hours < 12) {
        hours += 12;
      } else if (!isPM && hours === 12) {
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

  // Handle polar regions special cases - long day/night cycles
  const isPolarRegion = Math.abs(latitude) > 66;
  
  const moonriseTime = parseMoonTime(moonrise);
  const moonsetTime = parseMoonTime(moonset);
  
  // If we can't parse the times or in polar regions, use phase-based estimates
  if (!moonriseTime || !moonsetTime || isPolarRegion) {
    console.log("Using phase-based estimate for moonless night calculations");
    return getPhaseBasedMoonlessNight(moonPhase, latitude);
  }
  
  // Adjust dates for moonrise/moonset that might refer to tomorrow or yesterday
  const now = new Date();
  const currentHour = now.getHours();
  
  // Improved handling of the timeline to work in any timezone
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
  
  // Determine astronomical night period based on latitude 
  // (night is shorter near equator and longer near poles)
  const nightStart = new Date();
  const nightEnd = new Date();
  
  // Adjust night duration based on latitude (more accurate astronomical dark hours)
  if (Math.abs(latitude) < 30) {
    // Near equator - shorter night periods year round
    nightStart.setHours(19, 30, 0, 0); // 7:30 PM
    nightEnd.setHours(5, 30, 0, 0); // 5:30 AM 
  } else if (Math.abs(latitude) > 50) {
    // Higher latitudes - adjust for seasonal variations
    const isNorthern = latitude >= 0;
    const month = now.getMonth(); // 0-11
    
    // Summer
    if ((isNorthern && (month >= 4 && month <= 8)) || (!isNorthern && (month <= 1 || month >= 10))) {
      nightStart.setHours(21, 30, 0, 0); // 9:30 PM - later sunset in summer
      nightEnd.setHours(4, 30, 0, 0); // 4:30 AM - earlier sunrise in summer
    } else {
      // Winter
      nightStart.setHours(18, 0, 0, 0); // 6 PM - earlier sunset in winter
      nightEnd.setHours(7, 0, 0, 0); // 7 AM - later sunrise in winter
    }
  } else {
    // Mid latitudes - standard night period
    nightStart.setHours(20, 0, 0, 0); // 8 PM
    nightEnd.setHours(6, 0, 0, 0); // 6 AM
  }
  
  if (nightEnd <= nightStart) {
    nightEnd.setDate(nightEnd.getDate() + 1);
  }
  
  // Calculate moonless period with improved accuracy across hemispheres
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
 * Enhanced to consider latitude for polar and equatorial regions
 */
const getPhaseBasedMoonlessNight = (moonPhase: number, latitude: number): MoonlessNightInfo => {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const isNorthern = latitude >= 0;
  
  // Default night period adjusted for latitude
  const nightStart = new Date();
  const nightEnd = new Date();
  
  // Adjust night hours based on latitude and season
  if (Math.abs(latitude) > 66) {
    // Polar regions - special handling for extreme day/night cycles
    const isSummerSeason = (isNorthern && (month >= 4 && month <= 8)) || 
                          (!isNorthern && (month <= 1 || month >= 10));
    
    if (isSummerSeason) {
      // Polar summer - very short or no night
      nightStart.setHours(23, 0, 0, 0); // 11 PM
      nightEnd.setHours(3, 0, 0, 0); // 3 AM
    } else {
      // Polar winter - very long night
      nightStart.setHours(16, 0, 0, 0); // 4 PM
      nightEnd.setHours(9, 0, 0, 0); // 9 AM
    }
  } else if (Math.abs(latitude) < 30) {
    // Near equator - consistent ~12 hour nights
    nightStart.setHours(19, 0, 0, 0); // 7 PM
    nightEnd.setHours(5, 30, 0, 0); // 5:30 AM
  } else {
    // Mid-latitudes - seasonal variation
    const isSummerSeason = (isNorthern && (month >= 4 && month <= 8)) || 
                          (!isNorthern && (month <= 1 || month >= 10));
    
    if (isSummerSeason) {
      nightStart.setHours(21, 0, 0, 0); // 9 PM
      nightEnd.setHours(5, 0, 0, 0); // 5 AM
    } else {
      nightStart.setHours(18, 0, 0, 0); // 6 PM
      nightEnd.setHours(7, 0, 0, 0); // 7 AM
    }
  }
  
  if (nightEnd <= nightStart) {
    nightEnd.setDate(nightEnd.getDate() + 1);
  }
  
  // Default format function
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Calculate total night duration
  const totalNightHours = (nightEnd.getTime() - nightStart.getTime()) / (1000 * 60 * 60);
  
  // Adjust moonless duration based on moon phase
  let moonlessStart = new Date(nightStart);
  let moonlessEnd = new Date(nightEnd);
  let moonlessHours: number;
  
  if (moonPhase > 0.4 && moonPhase < 0.6) {
    // Near full moon - minimal moonless time (20% of night)
    moonlessHours = Math.max(0.5, totalNightHours * 0.2);
    moonlessStart = new Date(nightEnd);
    moonlessStart.setMilliseconds(nightEnd.getMilliseconds() - moonlessHours * 60 * 60 * 1000);
  } else if (moonPhase >= 0.25 && moonPhase <= 0.75) {
    // Half moon - partial moonless time (50% of night)
    moonlessHours = totalNightHours * 0.5;
    moonlessStart = new Date(nightStart);
    moonlessStart.setMilliseconds(nightStart.getMilliseconds() + (totalNightHours * 0.25) * 60 * 60 * 1000);
  } else if (moonPhase < 0.1 || moonPhase > 0.9) {
    // Near new moon - mostly dark (full night)
    moonlessHours = totalNightHours;
  } else {
    // Crescent moon - good moonless time (80% of night)
    moonlessHours = totalNightHours * 0.8;
    moonlessStart = new Date(nightStart);
    moonlessStart.setMilliseconds(nightStart.getMilliseconds() + (totalNightHours * 0.1) * 60 * 60 * 1000);
  }
  
  // Days until new moon
  const daysUntilNewMoon = calculateDaysUntilNewMoon(moonPhase);
  
  return {
    duration: Math.round(moonlessHours * 10) / 10, // Round to 1 decimal
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
