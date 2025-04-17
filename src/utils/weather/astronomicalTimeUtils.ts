
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
    return { sunrise: times.sunrise, sunset: times.sunset };
  } catch (error) {
    console.error("Error calculating sun times:", error);
    
    // Fallback calculation
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
    const times = SunCalc.getTimes(date, latitude, longitude);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayTimes = SunCalc.getTimes(nextDay, latitude, longitude);
    
    return { 
      start: times.night, // Astronomical dusk (sun 18° below horizon)
      end: nextDayTimes.nightEnd // Astronomical dawn (sun 18° below horizon)
    };
  } catch (error) {
    console.error("Error calculating astronomical night:", error);
    
    // Use regular sunset/sunrise as fallback with adjustment
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
  
  return { start: optimalStart, end: optimalEnd };
}

/**
 * Fallback calculation for sunset/sunrise when SunCalc fails
 * Based on latitude and season
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
  
  const sunset = new Date(date);
  const sunrise = new Date(date);
  sunrise.setDate(sunrise.getDate() + 1); // Next day sunrise
  
  // Adjust based on latitude
  if (Math.abs(latitude) >= 24 && Math.abs(latitude) <= 30) {
    // Guizhou province (subtropical)
    if (isSummer) {
      sunset.setHours(19, 15, 0, 0); // 7:15 PM
      sunrise.setHours(5, 45, 0, 0); // 5:45 AM
    } else {
      sunset.setHours(17, 45, 0, 0); // 5:45 PM
      sunrise.setHours(7, 0, 0, 0); // 7:00 AM
    }
  } else if (Math.abs(latitude) > 60) {
    // Polar regions
    if (isNorthern === isSummer) {
      sunset.setHours(22, 0, 0, 0); // 10:00 PM or later
      sunrise.setHours(4, 0, 0, 0); // 4:00 AM or earlier
    } else {
      sunset.setHours(16, 0, 0, 0); // 4:00 PM or earlier
      sunrise.setHours(9, 0, 0, 0); // 9:00 AM or later
    }
  } else if (Math.abs(latitude) < 23.5) {
    // Equatorial regions - consistent day length
    sunset.setHours(18, 30, 0, 0); // 6:30 PM
    sunrise.setHours(6, 0, 0, 0); // 6:00 AM
  } else {
    // Mid latitudes
    if (isSummer) {
      sunset.setHours(20, 30, 0, 0); // 8:30 PM
      sunrise.setHours(5, 30, 0, 0); // 5:30 AM
    } else {
      sunset.setHours(17, 0, 0, 0); // 5:00 PM
      sunrise.setHours(7, 30, 0, 0); // 7:30 AM
    }
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
