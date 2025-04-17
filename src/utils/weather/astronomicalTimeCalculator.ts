
/**
 * Utility functions for calculating astronomical time periods related to
 * night, twilight, and optimal stargazing conditions
 */

import { getAstronomicalNight } from './astronomicalTimeUtils';

/**
 * Calculate day period (sunrise to sunset) for displaying in the UI
 * @param sunriseTime Sunrise time
 * @param sunsetTime Sunset time
 * @returns Object with formatted start, end and duration in hours
 */
export const calculateDayPeriod = (sunriseTime: Date, sunsetTime: Date) => {
  const durationMs = sunsetTime.getTime() - sunriseTime.getTime();
  const durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
  
  return {
    start: formatTimeString(sunriseTime),
    end: formatTimeString(sunsetTime),
    duration: formatDuration(durationHours)
  };
};

/**
 * Calculate night period (sunset to sunrise) for displaying in the UI
 * @param sunsetTime Sunset time
 * @param nextSunriseTime Next day's sunrise time
 * @returns Object with formatted start, end and duration in hours
 */
export const calculateNightPeriod = (sunsetTime: Date, nextSunriseTime: Date) => {
  const durationMs = nextSunriseTime.getTime() - sunsetTime.getTime();
  const durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
  
  return {
    start: formatTimeString(sunsetTime),
    end: formatTimeString(nextSunriseTime),
    duration: formatDuration(durationHours)
  };
};

/**
 * Calculate moon visibility period for displaying in the UI
 * @param moonriseTime Moonrise time
 * @param moonsetTime Moonset time
 * @returns Object with formatted start, end and duration in hours
 */
export const calculateMoonPeriod = (moonriseTime: Date, moonsetTime: Date) => {
  const durationMs = moonsetTime.getTime() - moonriseTime.getTime();
  const durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
  
  return {
    start: formatTimeString(moonriseTime),
    end: formatTimeString(moonsetTime),
    duration: formatDuration(durationHours)
  };
};

/**
 * Calculate moonless night period for displaying in the UI
 * @param moonlessStart Start of moonless period
 * @param moonlessEnd End of moonless period
 * @returns Object with formatted start, end and duration in hours
 */
export const calculateMoonlessPeriod = (moonlessStart: Date, moonlessEnd: Date) => {
  const durationMs = moonlessEnd.getTime() - moonlessStart.getTime();
  const durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
  
  return {
    start: formatTimeString(moonlessStart),
    end: formatTimeString(moonlessEnd),
    duration: formatDuration(durationHours)
  };
};

/**
 * Format a Date object as a time string (HH:MM)
 * @param date Date object to format
 * @returns Formatted time string
 */
export const formatTimeString = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format duration hours into hours and minutes
 * @param hours Duration in hours (can be decimal)
 * @returns Formatted duration string (e.g. "5h 30m")
 */
export const formatDuration = (hours: number): string => {
  const totalMinutes = Math.round(hours * 60);
  const hoursPart = Math.floor(totalMinutes / 60);
  const minutesPart = totalMinutes % 60;
  
  if (hoursPart === 0) {
    return `${minutesPart}m`;
  } else if (minutesPart === 0) {
    return `${hoursPart}h`;
  } else {
    return `${hoursPart}h ${minutesPart}m`;
  }
};

/**
 * Get all astronomical time periods for a location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param moonriseTime Moonrise time
 * @param moonsetTime Moonset time
 * @returns Object with day, night, moon and moonless period information
 */
export const getAllAstronomicalPeriods = (
  latitude: number, 
  longitude: number,
  moonriseTime: Date | null,
  moonsetTime: Date | null
) => {
  // Get astronomical night (precise sunset/sunrise with adjustments for twilight)
  const astronomicalNight = getAstronomicalNight(latitude, longitude);
  const sunset = astronomicalNight.start;
  const sunrise = astronomicalNight.end;
  
  // Default to current time if moon times are null
  const now = new Date();
  const defaultMoonrise = new Date(now);
  const defaultMoonset = new Date(now);
  defaultMoonrise.setHours(now.getHours() + 1, 0, 0, 0);
  defaultMoonset.setHours(now.getHours() + 8, 0, 0, 0);
  
  const moonrise = moonriseTime || defaultMoonrise;
  const moonset = moonsetTime || defaultMoonset;
  
  // Calculate day period (sunrise to sunset)
  const dayPeriod = calculateDayPeriod(sunrise, sunset);
  
  // Calculate night period (sunset to next sunrise)
  const nightPeriod = calculateNightPeriod(sunset, sunrise);
  
  // Calculate moon period (moonrise to moonset)
  const moonPeriod = calculateMoonPeriod(moonrise, moonset);
  
  // Calculate moonless night period
  // This is when the moon is not visible during night hours
  
  // If moon rises after sunset and before sunrise
  let moonlessStart: Date;
  let moonlessEnd: Date;
  
  if (moonrise.getTime() >= sunset.getTime() && moonrise.getTime() <= sunrise.getTime()) {
    // Moon rises during the night - moonless period is from sunset to moonrise
    moonlessStart = new Date(sunset);
    moonlessEnd = new Date(moonrise);
  } else if (moonset.getTime() >= sunset.getTime() && moonset.getTime() <= sunrise.getTime()) {
    // Moon sets during the night - moonless period is from moonset to sunrise
    moonlessStart = new Date(moonset);
    moonlessEnd = new Date(sunrise);
  } else if (moonrise.getTime() <= sunset.getTime() && moonset.getTime() >= sunrise.getTime()) {
    // Moon is visible all night - no moonless period
    moonlessStart = new Date(sunset);
    moonlessEnd = new Date(sunset); // Same time means no moonless period
  } else {
    // Moon is not visible during night - entire night is moonless
    moonlessStart = new Date(sunset);
    moonlessEnd = new Date(sunrise);
  }
  
  const moonlessPeriod = calculateMoonlessPeriod(moonlessStart, moonlessEnd);
  
  return {
    dayPeriod,
    nightPeriod,
    moonPeriod,
    moonlessPeriod,
    hasMoonlessPeriod: moonlessStart.getTime() !== moonlessEnd.getTime()
  };
};
