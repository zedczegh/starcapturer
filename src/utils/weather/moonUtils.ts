import { calculateMoonPhase, calculateMoonriseMoonsetTimes, getNextNewMoonDate } from '@/services/realTimeSiqs/moonPhaseCalculator';
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
        
        // Convert 12h to 24h if needed
        if (isPM && hours < 12) {
          hours += 12;
        } else if (!isPM && hours === 12) {
          hours = 0;
        }
      } else {
        // Try 24-hour format (common in China and many other countries)
        const time24Match = timeStr.match(/(\d{1,2})[:.'](\d{1,2})?/);
        if (time24Match) {
          hours = parseInt(time24Match[1], 10);
          minutes = time24Match[2] ? parseInt(time24Match[2], 10) : 0;
        } else {
          return null; // Could not parse time
        }
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
  
  console.log(`Raw moonrise: ${moonrise}, Raw moonset: ${moonset}`);
  console.log(`Parsed moonrise: ${moonriseTime?.toLocaleTimeString()}, Parsed moonset: ${moonsetTime?.toLocaleTimeString()}`);
  
  // If we can't parse the times or in polar regions, use phase-based estimates
  if (!moonriseTime || !moonsetTime || isPolarRegion) {
    console.log("Using phase-based estimate for moonless night calculations");
    return getPhaseBasedMoonlessNight(moonPhase, latitude);
  }
  
  // Adjust dates for moonrise/moonset that might refer to tomorrow or yesterday
  const now = new Date();
  const currentHour = now.getHours();
  
  // Improved handling of the timeline to work in any timezone
  // Determine current night period based on local time
  const isNighttime = currentHour >= 18 || currentHour < 6;
  
  // Logic for adjusting moonrise/set to appropriate day
  // This is critical for China time zone (UTC+8)
  
  // If moonset is early morning and current time is evening, it's tomorrow's moonset
  if (moonsetTime.getHours() < 12 && currentHour > 12) {
    moonsetTime.setDate(moonsetTime.getDate() + 1);
  }
  
  // If moonrise is in the evening (after 12pm) and now is morning (before 12pm),
  // it's yesterday's moonrise
  if (moonriseTime.getHours() >= 12 && currentHour < 12) {
    moonriseTime.setDate(moonriseTime.getDate() - 1);
  }
  // If moonrise is in the morning and now is evening, it's tomorrow's moonrise
  else if (moonriseTime.getHours() < 12 && currentHour >= 12) {
    moonriseTime.setDate(moonriseTime.getDate() + 1);
  }
  
  console.log(`Adjusted moonrise: ${moonriseTime.toLocaleString()}, Adjusted moonset: ${moonsetTime.toLocaleString()}`);
  
  // Determine astronomical night period based on latitude and season
  // Crucial for China which spans many latitude bands
  const nightStart = new Date();
  const nightEnd = new Date();
  const month = now.getMonth(); // 0-11
  
  // Guizhou province is around 26°N latitude - subtropical region
  // Adjust night period based on latitude and season
  if (Math.abs(latitude) < 30) {
    // Subtropical nights - consistent year-round but with seasonal variations
    // For Guizhou specifically
    if (month >= 4 && month <= 8) {
      // Summer
      nightStart.setHours(19, 30, 0, 0); // 7:30 PM
      nightEnd.setHours(5, 30, 0, 0); // 5:30 AM 
    } else {
      // Winter
      nightStart.setHours(18, 30, 0, 0); // 6:30 PM
      nightEnd.setHours(6, 30, 0, 0); // 6:30 AM
    }
  } else if (Math.abs(latitude) > 50) {
    // Higher latitudes - adjust for seasonal variations
    const isNorthern = latitude >= 0;
    
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
    // Mid latitudes - standard night period with seasonal adjustment
    if (month >= 4 && month <= 8) {
      // Summer
      nightStart.setHours(20, 30, 0, 0); // 8:30 PM
      nightEnd.setHours(5, 30, 0, 0); // 5:30 AM
    } else {
      // Winter
      nightStart.setHours(19, 0, 0, 0); // 7 PM
      nightEnd.setHours(6, 30, 0, 0); // 6:30 AM
    }
  }
  
  if (nightEnd <= nightStart) {
    nightEnd.setDate(nightEnd.getDate() + 1);
  }
  
  console.log(`Night period: ${nightStart.toLocaleTimeString()} - ${nightEnd.toLocaleTimeString()}`);
  
  // Calculate moonless periods
  // Case 1: Moon is not in the sky during nighttime
  let moonlessStart, moonlessEnd;
  let moonlessDescription = '';
  
  // Determine the time when moon is not in the sky during the night
  if (moonsetTime <= moonriseTime) {
    // Moon sets before rising - moon is below horizon between these times
    
    // Is moonset within our night period?
    if (moonsetTime >= nightStart && moonsetTime <= nightEnd) {
      moonlessStart = new Date(moonsetTime);
      moonlessDescription = 'Moon sets during night';
    } else if (moonsetTime < nightStart) {
      moonlessStart = new Date(nightStart);
      moonlessDescription = 'Moon already below horizon at night start';
    } else {
      // Moonset after night end - no moonless period this night
      moonlessStart = new Date(nightEnd);
      moonlessDescription = 'No moonless period (moon sets after night ends)';
    }
    
    // Is moonrise within our night period?
    if (moonriseTime >= nightStart && moonriseTime <= nightEnd) {
      moonlessEnd = new Date(moonriseTime);
      moonlessDescription += ', rises during night';
    } else if (moonriseTime > nightEnd) {
      moonlessEnd = new Date(nightEnd);
      moonlessDescription += ', still below horizon at night end';
    } else {
      // Moonrise before night start - no moonless period this night
      moonlessEnd = new Date(nightStart);
      moonlessDescription += ', rises before night starts';
    }
  } 
  // Case 2: Moon rises before setting - moon is above horizon between these times
  else {
    // First check if either rise or set occurs during night
    const riseInNight = moonriseTime >= nightStart && moonriseTime <= nightEnd;
    const setInNight = moonsetTime >= nightStart && moonsetTime <= nightEnd;
    
    // Night starts with no moon, moon rises during night
    if (riseInNight && !setInNight) {
      moonlessStart = new Date(nightStart);
      moonlessEnd = new Date(moonriseTime);
      moonlessDescription = 'Moon rises during night, night starts moonless';
    }
    // Night starts with moon, moon sets during night
    else if (!riseInNight && setInNight) {
      moonlessStart = new Date(moonsetTime);
      moonlessEnd = new Date(nightEnd);
      moonlessDescription = 'Moon sets during night, night ends moonless';
    }
    // Both rise and set during night
    else if (riseInNight && setInNight) {
      if (moonriseTime < moonsetTime) {
        // Moon rises then sets - two moonless periods
        // We'll take the longer one
        const period1 = moonriseTime.getTime() - nightStart.getTime();
        const period2 = nightEnd.getTime() - moonsetTime.getTime();
        
        if (period1 >= period2) {
          moonlessStart = new Date(nightStart);
          moonlessEnd = new Date(moonriseTime);
          moonlessDescription = 'Moon rises & sets in night - using first moonless period';
        } else {
          moonlessStart = new Date(moonsetTime);
          moonlessEnd = new Date(nightEnd);
          moonlessDescription = 'Moon rises & sets in night - using second moonless period';
        }
      } else {
        // Unusual case: sets then rises - moon crosses midnight
        moonlessStart = new Date(moonsetTime);
        moonlessEnd = new Date(moonriseTime);
        moonlessDescription = 'Moon sets then rises - unusual case';
      }
    }
    // Neither rise nor set during night, moon could be visible all night or not at all
    else {
      // If rise before night start and set after night end, moon is up all night
      if (moonriseTime < nightStart && moonsetTime > nightEnd) {
        // No true moonless period (use phase-based estimate)
        const phaseBasedInfo = getPhaseBasedMoonlessNight(moonPhase, latitude);
        
        // Only use start/end times, keep actual rise/set for display
        moonlessStart = parseMoonTime(phaseBasedInfo.startTime) || new Date(nightStart);
        moonlessEnd = parseMoonTime(phaseBasedInfo.endTime) || new Date(nightEnd);
        
        // Adjust duration based on moon phase (fraction of night)
        const nightDuration = (nightEnd.getTime() - nightStart.getTime()) / (1000 * 60 * 60);
        
        // For Guizhou specifically (specific to user's location)
        const durationFactors = {
          fullMoon: 0.2, // 20% of night is usable
          halfMoon: 0.5, // 50% of night is usable
          crescentMoon: 0.7, // 70% of night is usable
          newMoon: 0.9 // 90% of night is usable
        };
        
        let usableFraction;
        if (moonPhase > 0.4 && moonPhase < 0.6) {
          usableFraction = durationFactors.fullMoon; // Near full moon
        } else if ((moonPhase > 0.25 && moonPhase < 0.4) || (moonPhase > 0.6 && moonPhase < 0.75)) {
          usableFraction = durationFactors.halfMoon; // Half moon
        } else if ((moonPhase > 0.1 && moonPhase < 0.25) || (moonPhase > 0.75 && moonPhase < 0.9)) {
          usableFraction = durationFactors.crescentMoon; // Crescent
        } else {
          usableFraction = durationFactors.newMoon; // Near new moon
        }
        
        // Adjust end time to match desired duration
        const desiredDuration = nightDuration * usableFraction;
        moonlessEnd = new Date(moonlessStart.getTime() + desiredDuration * 60 * 60 * 1000);
        
        moonlessDescription = 'Moon visible all night, using phase-based estimate';
      } else {
        // If rise after night end and set before night start, moon is down all night
        moonlessStart = new Date(nightStart);
        moonlessEnd = new Date(nightEnd);
        moonlessDescription = 'Full night is moonless';
      }
    }
  }
  
  console.log(`Moonless period: ${moonlessStart.toLocaleTimeString()} - ${moonlessEnd.toLocaleTimeString()}`);
  console.log(`Calculation method: ${moonlessDescription}`);
  
  // Calculate duration in hours with 1 decimal accuracy
  const durationMs = moonlessEnd.getTime() - moonlessStart.getTime();
  const durationHours = Math.max(0.5, durationMs / (1000 * 60 * 60)); // At least 0.5 hour
  
  // Format times for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Days until new moon
  const nextNewMoon = getNextNewMoonDate();
  const today = new Date();
  const daysUntilNewMoon = Math.round((nextNewMoon.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
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
  const daysUntilNewMoon = Math.round(phase * 29.53059);
  return daysUntilNewMoon;
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
    // Subtropical region (like Guizhou)
    if (month >= 4 && month <= 8) {
      // Summer
      nightStart.setHours(19, 30, 0, 0); // 7:30 PM
      nightEnd.setHours(5, 30, 0, 0); // 5:30 AM 
    } else {
      // Winter
      nightStart.setHours(18, 30, 0, 0); // 6:30 PM
      nightEnd.setHours(6, 30, 0, 0); // 6:30 AM
    }
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
  const nextNewMoon = getNextNewMoonDate();
  const today = new Date();
  const daysUntilNewMoon = Math.round((nextNewMoon.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
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
