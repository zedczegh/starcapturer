
/**
 * Utility functions for calculating astronomical timing of twilight, 
 * night periods, and optimal viewing windows
 */

import * as SunCalc from 'suncalc';

/**
 * Types of twilight periods
 */
export enum TwilightType {
  Civil = 'civil',
  Nautical = 'nautical',
  Astronomical = 'astronomical'
}

/**
 * Get sunset and sunrise times for a specific location
 * 
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param date Date to calculate for (defaults to today)
 * @returns Object containing sunset and sunrise times
 */
export function getSunTimes(
  latitude: number, 
  longitude: number, 
  date = new Date()
): { sunrise: Date; sunset: Date } {
  try {
    const times = SunCalc.getTimes(date, latitude, longitude);
    
    // Validate the returned times to ensure they're real dates
    if (isNaN(times.sunrise.getTime()) || isNaN(times.sunset.getTime())) {
      throw new Error("SunCalc returned invalid date");
    }
    
    return { sunrise: times.sunrise, sunset: times.sunset };
  } catch (error) {
    console.error("Error calculating sun times:", error);
    
    // Fallback calculation with improved polar handling
    const fallback = getFallbackSunTimes(latitude, date);
    return fallback;
  }
}

/**
 * Get astronomical twilight times (when sky is fully dark)
 * 
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param date Date to calculate for (defaults to today)
 * @returns Object containing start and end of astronomical night
 */
export function getAstronomicalNight(
  latitude: number, 
  longitude: number, 
  date = new Date()
): { start: Date; end: Date } {
  try {
    // For polar regions during continuous day/night, SunCalc can return invalid values
    // Handle polar regions separately
    if (Math.abs(latitude) > 66.5) { // Arctic/Antarctic Circles
      const month = date.getMonth(); // 0-11
      const isNorthern = latitude > 0;
      
      // Check for polar day/night conditions
      if ((isNorthern && (month >= 4 && month <= 8)) || // Northern summer
          (!isNorthern && (month >= 10 || month <= 2))) { // Southern summer
        // Possible polar day - check if sun actually sets
        const times = SunCalc.getTimes(date, latitude, longitude);
        
        // If night/nightEnd are invalid dates, we have polar day (no astronomical night)
        if (isNaN(times.night.getTime()) || isNaN(times.nightEnd.getTime())) {
          // Create artificial night (short period around midnight)
          const artificialNight = new Date(date);
          artificialNight.setHours(0, 0, 0, 0);
          const artificialEnd = new Date(artificialNight);
          artificialEnd.setHours(0, 30, 0, 0); // 30-minute symbolically dark period
          
          return { start: artificialNight, end: artificialEnd };
        }
      } else if ((isNorthern && (month >= 10 || month <= 2)) || // Northern winter
                (!isNorthern && (month >= 4 && month <= 8))) { // Southern winter
        // Possible polar night - check if sun actually rises
        const times = SunCalc.getTimes(date, latitude, longitude);
        
        // If sunrise/sunset are invalid dates, we have polar night (24-hour astronomical night)
        if (isNaN(times.sunrise.getTime()) || isNaN(times.sunset.getTime())) {
          // Entire 24 hours is astronomical night
          const fullDayStart = new Date(date);
          fullDayStart.setHours(0, 0, 0, 0);
          const fullDayEnd = new Date(date);
          fullDayEnd.setHours(23, 59, 59, 999);
          
          return { start: fullDayStart, end: fullDayEnd };
        }
      }
    }
    
    // Standard calculation for non-polar regions or when polar regions have normal sun cycles
    const times = SunCalc.getTimes(date, latitude, longitude);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayTimes = SunCalc.getTimes(nextDay, latitude, longitude);
    
    // Verify the times are valid
    if (isNaN(times.night.getTime()) || isNaN(nextDayTimes.nightEnd.getTime())) {
      throw new Error("SunCalc returned invalid astronomical night times");
    }
    
    return { 
      start: times.night, // Astronomical dusk (sun 18° below horizon)
      end: nextDayTimes.nightEnd // Astronomical dawn (sun 18° below horizon)
    };
  } catch (error) {
    console.error("Error calculating astronomical night:", error);
    
    // Use regular sunset/sunrise as fallback with adjustment for astronomical twilight
    const { sunrise, sunset } = getFallbackSunTimes(latitude, date);
    
    // Adjust for astronomical twilight (roughly 1.5 hours after sunset/before sunrise)
    const nightStart = new Date(sunset);
    nightStart.setMinutes(nightStart.getMinutes() + 90);
    
    const nightEnd = new Date(sunrise);
    nightEnd.setMinutes(nightEnd.getMinutes() - 90);
    
    return { start: nightStart, end: nightEnd };
  }
}

/**
 * Get optimal stargazing period considering moon and sun position
 * 
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param date Date to calculate for (defaults to today)
 * @returns Object containing start and end of optimal viewing period
 */
export function getOptimalViewingPeriod(
  latitude: number, 
  longitude: number, 
  date = new Date()
): { start: Date; end: Date } {
  try {
    const { start: nightStart, end: nightEnd } = getAstronomicalNight(latitude, longitude, date);
    
    // Optimal time is typically centered on midnight
    const midnight = new Date(date);
    midnight.setHours(0, 0, 0, 0);
    midnight.setDate(midnight.getDate() + 1); // Next day midnight
    
    // Get 3 hours centered on midnight, but constrained within astronomical night
    const optimalStart = new Date(Math.max(
      nightStart.getTime(),
      midnight.getTime() - (90 * 60 * 1000) // 1.5 hours before midnight
    ));
    
    const optimalEnd = new Date(Math.min(
      nightEnd.getTime(),
      midnight.getTime() + (90 * 60 * 1000) // 1.5 hours after midnight
    ));
    
    // Verify the times make sense (end should be after start)
    if (optimalEnd.getTime() <= optimalStart.getTime()) {
      // If times are inverted, use the full astronomical night period
      return { start: nightStart, end: nightEnd };
    }
    
    return { start: optimalStart, end: optimalEnd };
  } catch (error) {
    console.error("Error calculating optimal viewing period:", error);
    
    // Fallback to a reasonable estimate centered around midnight
    const midnight = new Date(date);
    midnight.setHours(0, 0, 0, 0);
    midnight.setDate(midnight.getDate() + 1); // Next day midnight
    
    const optimalStart = new Date(midnight);
    optimalStart.setHours(optimalStart.getHours() - 1); // 1 hour before midnight
    
    const optimalEnd = new Date(midnight);
    optimalEnd.setHours(optimalEnd.getHours() + 1); // 1 hour after midnight
    
    return { start: optimalStart, end: optimalEnd };
  }
}

/**
 * Improved fallback calculation for sunset/sunrise when SunCalc fails
 * Based on latitude, season, and improved polar handling
 * 
 * @param latitude Location latitude
 * @param date Date to calculate for
 * @returns Estimated sunrise/sunset times
 */
function getFallbackSunTimes(
  latitude: number,
  date = new Date()
): { sunrise: Date; sunset: Date } {
  const month = date.getMonth(); // 0-11
  const isNorthern = latitude >= 0;
  const isSummer = (isNorthern && (month >= 3 && month <= 8)) || 
                  (!isNorthern && (month >= 9 || month <= 2));
  
  // Check for polar day/night conditions
  const isPolarRegion = Math.abs(latitude) > 66.5;
  const isPolarDay = (isNorthern && isSummer && latitude > 66.5) || 
                     (!isNorthern && !isSummer && latitude < -66.5);
  const isPolarNight = (isNorthern && !isSummer && latitude > 66.5) || 
                      (!isNorthern && isSummer && latitude < -66.5);
  
  const sunset = new Date(date);
  const sunrise = new Date(date);
  sunrise.setDate(sunrise.getDate() + 1); // Next day sunrise
  
  if (isPolarRegion) {
    if (isPolarDay) {
      // Polar day - sun doesn't set
      sunset.setHours(23, 59, 59, 0); // Just before midnight
      sunrise.setHours(0, 0, 1, 0);   // Just after midnight
    } else if (isPolarNight) {
      // Polar night - sun doesn't rise
      sunset.setHours(0, 0, 1, 0);    // Just after midnight
      sunrise.setHours(23, 59, 59, 0); // Just before midnight
    } else {
      // Transition periods - very late sunset or very early sunrise
      if (isSummer) {
        sunset.setHours(22, 0, 0, 0); // 10:00 PM or later
        sunrise.setHours(4, 0, 0, 0);  // 4:00 AM or earlier
      } else {
        sunset.setHours(15, 0, 0, 0); // 3:00 PM or earlier
        sunrise.setHours(9, 0, 0, 0);  // 9:00 AM or later
      }
    }
  } else if (Math.abs(latitude) >= 23.5 && Math.abs(latitude) <= 66.5) {
    // Mid latitudes - significant seasonal variation
    const seasonalFactor = Math.abs(latitude - 23.5) / 43; // 0 at tropics, 1 at polar circle
    
    if (isSummer) {
      const sunsetHour = 18 + Math.round(seasonalFactor * 4);
      const sunriseHour = 6 - Math.round(seasonalFactor * 3);
      
      sunset.setHours(sunsetHour, 30, 0, 0);
      sunrise.setHours(sunriseHour, 30, 0, 0);
    } else {
      const sunsetHour = 18 - Math.round(seasonalFactor * 3);
      const sunriseHour = 6 + Math.round(seasonalFactor * 3);
      
      sunset.setHours(sunsetHour, 30, 0, 0);
      sunrise.setHours(sunriseHour, 30, 0, 0);
    }
  } else {
    // Equatorial regions - consistent day length year-round
    sunset.setHours(18, 30, 0, 0); // 6:30 PM
    sunrise.setHours(6, 0, 0, 0);  // 6:00 AM
  }
  
  return { sunset, sunrise };
}

/**
 * Format a Date object as a time string
 * 
 * @param date Date to format
 * @returns Time string in HH:MM format
 */
export function formatTimeString(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Calculate night duration in hours
 * 
 * @param start Start of night period
 * @param end End of night period
 * @returns Duration in decimal hours
 */
export function calculateNightDuration(start: Date, end: Date): number {
  const durationMs = end.getTime() - start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  return Math.round(durationHours * 10) / 10; // Round to 1 decimal
}
