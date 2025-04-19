
import { calculateMoonPhase, calculateMoonriseMoonsetTimes, getNextNewMoonDate } from '@/services/realTimeSiqs/moonPhaseCalculator';
import type { MoonlessNightInfo } from '@/services/realTimeSiqs/siqsTypes';
import { getAstronomicalNight, formatTimeString } from '@/utils/weather/astronomicalTimeUtils';
import { getAllAstronomicalPeriods } from '@/utils/weather/astronomicalTimeCalculator';

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
  const { moonrise: moonriseString, moonset: moonsetString } = calculateMoonriseMoonsetTimes(latitude, longitude);
  
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
  
  const moonriseTime = parseMoonTime(moonriseString);
  const moonsetTime = parseMoonTime(moonsetString);
  
  console.log(`Raw moonrise: ${moonriseString}, Raw moonset: ${moonsetString}`);
  console.log(`Parsed moonrise: ${moonriseTime?.toLocaleTimeString()}, Parsed moonset: ${moonsetTime?.toLocaleTimeString()}`);
  
  // If we can't parse the times or in polar regions, use phase-based estimates
  if (!moonriseTime || !moonsetTime || isPolarRegion) {
    console.log("Using phase-based estimate for moonless night calculations");
    return getPhaseBasedMoonlessNight(moonPhase, latitude);
  }
  
  // Get astronomical night for context
  const astronomicalNight = getAstronomicalNight(latitude, longitude);
  const sunset = astronomicalNight.start;
  const sunrise = astronomicalNight.end;
  
  console.log(`Astronomical night: ${sunset.toLocaleTimeString()} - ${sunrise.toLocaleTimeString()}`);
  
  // Adjust dates for moonrise/moonset that might refer to tomorrow or yesterday
  const now = new Date();
  
  // Improved timeline handling for any timezone
  // Align all times to the same date reference for proper comparison
  const adjustedTimes = alignTimesToNightPeriod(moonriseTime, moonsetTime, sunset, sunrise, now);
  
  // Get all astronomical periods including precisely calculated moonless period
  const periods = getAllAstronomicalPeriods(
    latitude, 
    longitude,
    adjustedTimes.moonrise,
    adjustedTimes.moonset
  );
  
  // Calculate moonless night period - specifically when the moon is not visible during night
  // This is the key logic change to fix the issue
  let moonlessStart: Date;
  let moonlessEnd: Date;
  let description: string;
  
  const nightStart = adjustedTimes.sunset;
  const nightEnd = adjustedTimes.sunrise;
  const adjustedMoonrise = adjustedTimes.moonrise;
  const adjustedMoonset = adjustedTimes.moonset;
  
  // Case 1: Moon rises during the night period
  if (adjustedMoonrise.getTime() > nightStart.getTime() && adjustedMoonrise.getTime() < nightEnd.getTime()) {
    // Moonless period is from sunset until moonrise
    moonlessStart = new Date(nightStart);
    moonlessEnd = new Date(adjustedMoonrise);
    description = "Moonless from night start until moonrise";
  }
  // Case 2: Moon sets during the night period
  else if (adjustedMoonset.getTime() > nightStart.getTime() && adjustedMoonset.getTime() < nightEnd.getTime()) {
    // Moonless period is from moonset until sunrise
    moonlessStart = new Date(adjustedMoonset);
    moonlessEnd = new Date(nightEnd);
    description = "Moonless from moonset until night end";
  }
  // Case 3: Moon is not visible during the entire night (moon sets before night starts and rises after night ends)
  else if (adjustedMoonset.getTime() <= nightStart.getTime() && adjustedMoonrise.getTime() >= nightEnd.getTime()) {
    // Entire night is moonless
    moonlessStart = new Date(nightStart);
    moonlessEnd = new Date(nightEnd);
    description = "Entire night is moonless";
  }
  // Case 4: Moon is visible all night (rises before night starts and sets after night ends)
  else if (adjustedMoonrise.getTime() <= nightStart.getTime() && adjustedMoonset.getTime() >= nightEnd.getTime()) {
    // Limited or no moonless period
    // Use minimal period for UI purposes (could be adjusted to show "No moonless period")
    moonlessStart = new Date(nightEnd);
    moonlessStart.setMinutes(moonlessStart.getMinutes() - 30); // 30 minutes before sunrise as minimal period
    moonlessEnd = new Date(nightEnd);
    description = "Moon visible all night - minimal moonless period";
  }
  // Case 5: Other scenarios (fallback)
  else {
    // Use default calculation from astronomical periods
    moonlessStart = new Date(periods.moonlessPeriod.start ? 
      parseMoonTime(periods.moonlessPeriod.start) || nightStart :
      nightStart);
    moonlessEnd = new Date(periods.moonlessPeriod.end ? 
      parseMoonTime(periods.moonlessPeriod.end) || nightEnd : 
      nightEnd);
    description = "Using calculated moonless period";
  }
  
  console.log(`Moonless period: ${moonlessStart.toLocaleTimeString()} - ${moonlessEnd.toLocaleTimeString()}`);
  console.log(`Calculation method: ${description}`);
  
  // Calculate duration in hours with proper formatting
  const durationMs = moonlessEnd.getTime() - moonlessStart.getTime();
  const durationHours = Math.max(0.1, durationMs / (1000 * 60 * 60)); // At least 0.1 hour
  
  // Days until new moon
  const nextNewMoon = getNextNewMoonDate();
  const today = new Date();
  const daysUntilNewMoon = Math.round((nextNewMoon.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    duration: Math.round(durationHours * 10) / 10, // Round to 1 decimal
    startTime: formatTimeString(moonlessStart),
    endTime: formatTimeString(moonlessEnd),
    moonrise: adjustedMoonrise,
    moonset: adjustedMoonset,
    nextNewMoon: formatNextNewMoonDate(daysUntilNewMoon),
    daysUntilNewMoon,
    astronomicalNightStart: formatTimeString(nightStart),
    astronomicalNightEnd: formatTimeString(nightEnd),
    astronomicalNightDuration: Math.round((nightEnd.getTime() - nightStart.getTime()) / (1000 * 60 * 60) * 10) / 10
  };
};

/**
 * Align moonrise, moonset, sunset, and sunrise times to the same night period
 * Ensures correct timeline comparison
 */
function alignTimesToNightPeriod(
  moonriseTime: Date, 
  moonsetTime: Date, 
  sunset: Date, 
  sunrise: Date,
  now: Date
): { moonrise: Date; moonset: Date; sunset: Date; sunrise: Date } {
  const currentHour = now.getHours();
  const baseDate = new Date(now);
  baseDate.setHours(0, 0, 0, 0); // Midnight of current day
  
  // Clone all times to prevent mutation of originals
  const alignedMoonrise = new Date(moonriseTime);
  const alignedMoonset = new Date(moonsetTime);
  const alignedSunset = new Date(sunset);
  const alignedSunrise = new Date(sunrise);
  
  // First, adjust sunset/sunrise to correct day
  if (currentHour < 12) {
    // Morning: sunset was yesterday, sunrise is today
    alignedSunset.setDate(baseDate.getDate() - 1);
    alignedSunrise.setDate(baseDate.getDate());
  } else {
    // Afternoon/evening: sunset is today, sunrise is tomorrow
    alignedSunset.setDate(baseDate.getDate());
    alignedSunrise.setDate(baseDate.getDate() + 1);
  }
  
  // Now adjust moonrise/moonset relative to sunset/sunrise
  // If moonrise is before sunset and after previous sunrise, it's from previous night
  if (alignedMoonrise.getHours() < 12 && currentHour > 12) {
    if (alignedMoonrise.getTime() < alignedSunset.getTime()) {
      alignedMoonrise.setDate(baseDate.getDate() - 1);
    } else {
      alignedMoonrise.setDate(baseDate.getDate());
    }
  } 
  // If moonrise is after sunset, it's today's moonrise
  else if (alignedMoonrise.getHours() >= 12) {
    alignedMoonrise.setDate(baseDate.getDate());
  }
  
  // Similar logic for moonset
  // If moonset is after sunrise, it's today's moonset
  if (alignedMoonset.getHours() < 12) {
    alignedMoonset.setDate(baseDate.getDate());
  } 
  // If moonset is before sunrise and after previous sunset, it's from tonight
  else if (alignedMoonset.getHours() >= 12 && currentHour < 12) {
    alignedMoonset.setDate(baseDate.getDate() - 1);
  }
  
  // Ensure moonset is after moonrise (handle cases that cross midnight)
  if (alignedMoonset.getTime() < alignedMoonrise.getTime()) {
    // If moonset is before moonrise, it's the next day's moonset
    alignedMoonset.setDate(alignedMoonset.getDate() + 1);
  }
  
  return { 
    moonrise: alignedMoonrise, 
    moonset: alignedMoonset,
    sunset: alignedSunset,
    sunrise: alignedSunrise
  };
}

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
  nightEnd.setDate(nightEnd.getDate() + 1);
  
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
    daysUntilNewMoon,
    astronomicalNightStart: formatTime(nightStart),
    astronomicalNightEnd: formatTime(nightEnd),
    astronomicalNightDuration: Math.round(totalNightHours * 10) / 10
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
