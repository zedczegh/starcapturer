
import SunCalc from 'suncalc';
import { getTimeZoneFromCoordinates } from '../timeZoneUtils';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Calculate astronomical night times for a specific location
 * @param latitude Location latitude
 * @param longitude Location longitude 
 * @param date Optional date (defaults to today)
 * @returns Object with start and end times for astronomical night
 */
export const calculateAstronomicalNight = (
  latitude: number, 
  longitude: number,
  date?: Date
): { start: Date; end: Date } => {
  try {
    // Use today's date if not provided
    const targetDate = date || new Date();
    
    // Get the time zone for the coordinates
    const timeZone = getTimeZoneFromCoordinates(latitude, longitude);
    
    // Get astronomical twilight times for today
    const todayTimes = SunCalc.getTimes(targetDate, latitude, longitude);
    
    // Get astronomical twilight times for tomorrow (for end time if night spans two days)
    const tomorrowDate = new Date(targetDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowTimes = SunCalc.getTimes(tomorrowDate, latitude, longitude);
    
    // Astronomical night starts at evening astronomical twilight end
    const start = todayTimes.night;
    
    // Astronomical night ends at morning astronomical twilight start
    const end = todayTimes.nightEnd;
    
    // Handle edge cases where night or nightEnd might be invalid
    if (!start || isNaN(start.getTime())) {
      console.warn("Invalid astronomical night start time calculated");
      // Fallback to 6 PM in the location's time zone
      const fallbackStart = new Date(targetDate);
      fallbackStart.setHours(18, 0, 0, 0);
      return {
        start: fallbackStart,
        end: tomorrowTimes.nightEnd || new Date(tomorrowDate.setHours(6, 0, 0, 0))
      };
    }
    
    if (!end || isNaN(end.getTime()) || end <= start) {
      console.warn("Invalid astronomical night end time calculated");
      // Fallback to 6 AM the next day in the location's time zone
      const fallbackEnd = new Date(targetDate);
      fallbackEnd.setDate(fallbackEnd.getDate() + 1);
      fallbackEnd.setHours(6, 0, 0, 0);
      return {
        start,
        end: fallbackEnd
      };
    }
    
    return { start, end };
  } catch (error) {
    console.error("Error calculating astronomical night:", error);
    
    // Fallback to 6 PM - 6 AM definition
    const start = new Date();
    start.setHours(18, 0, 0, 0);
    
    const end = new Date();
    end.setDate(end.getDate() + 1);
    end.setHours(6, 0, 0, 0);
    
    return { start, end };
  }
};

/**
 * Format a time for display
 * @param date Date object to format
 * @param format Optional format string
 * @returns Formatted time string
 */
export const formatTime = (date: Date, format = 'HH:mm'): string => {
  if (!date || isNaN(date.getTime())) {
    return "--:--";
  }
  
  try {
    // Format using 24-hour time
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error("Error formatting time:", error);
    return "--:--";
  }
};

/**
 * Get length of astronomical night in hours
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Duration of astronomical night in hours
 */
export const getAstronomicalNightDuration = (latitude: number, longitude: number): number => {
  try {
    const { start, end } = calculateAstronomicalNight(latitude, longitude);
    
    // Calculate duration in milliseconds and convert to hours
    const durationMs = end.getTime() - start.getTime();
    return durationMs / (1000 * 60 * 60);
  } catch (error) {
    console.error("Error calculating astronomical night duration:", error);
    return 10; // Default to 10 hours if calculation fails
  }
};
