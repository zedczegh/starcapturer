
import { calculateMoonPhase, calculateMoonriseMoonsetTimes } from '@/services/realTimeSiqs/moonPhaseCalculator';
import type { MoonlessNightInfo } from '@/services/realTimeSiqs/siqsTypes';

/**
 * Calculate moonless night duration based on moonrise and moonset times
 * 
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns MoonlessNightInfo object with duration and timing details
 */
export const calculateMoonlessNightDuration = (latitude: number, longitude: number): MoonlessNightInfo => {
  const moonPhase = calculateMoonPhase();
  // Get moon times
  const { moonrise, moonset } = calculateMoonriseMoonsetTimes(latitude, longitude);
  
  // Parse times
  const parseMoonTime = (timeStr: string) => {
    const now = new Date();
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period && period.toLowerCase() === 'pm' && hours < 12) {
      hours += 12;
    }
    if (period && period.toLowerCase() === 'am' && hours === 12) {
      hours = 0;
    }
    
    const result = new Date(now);
    result.setHours(hours, minutes, 0, 0);
    return result;
  };
  
  const moonriseTime = parseMoonTime(moonrise);
  const moonsetTime = parseMoonTime(moonset);
  
  // Standard night period - default 6 PM to 7 AM
  const nightStart = new Date();
  nightStart.setHours(18, 0, 0, 0);
  
  const nightEnd = new Date();
  nightEnd.setHours(7, 0, 0, 0);
  if (nightEnd <= nightStart) {
    nightEnd.setDate(nightEnd.getDate() + 1);
  }
  
  // Calculate moonless period
  let moonlessStart, moonlessEnd;
  
  // Determine when the moonless period starts
  if (moonsetTime >= nightStart && moonsetTime <= nightEnd) {
    // Moon sets during night - moonless starts at moonset
    moonlessStart = moonsetTime;
  } else if (moonsetTime < nightStart && moonriseTime > nightEnd) {
    // Moon is not in the sky during our night window - entire night is moonless
    moonlessStart = nightStart;
  } else if (moonriseTime > nightStart && moonriseTime < nightEnd) {
    // Moon rises during night - moonless ends at moonrise
    moonlessStart = nightStart;
  } else {
    // Moon is up all night or complex scenario - use phase-based estimate
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
  
  // Calculate duration in hours
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
