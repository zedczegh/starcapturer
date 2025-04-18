
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Get current date and time for a specific location using its coordinates
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param format Optional date format string
 * @returns Formatted date and time string in the location's time zone
 */
export const getLocationDateTime = (
  latitude: number, 
  longitude: number, 
  format = 'yyyy-MM-dd HH:mm:ss'
): string => {
  try {
    // Get the time zone for the coordinates
    const timeZone = getTimeZoneFromCoordinates(latitude, longitude);
    const now = new Date();
    
    return formatInTimeZone(now, timeZone, format);
  } catch (error) {
    console.error("Error getting location date/time:", error);
    return new Date().toLocaleString();
  }
};

/**
 * Get time zone string from coordinates
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns IANA time zone string (e.g. "Etc/GMT+8")
 */
export const getTimeZoneFromCoordinates = (latitude: number, longitude: number): string => {
  try {
    // Use a simplified approach based on longitude
    // A proper implementation would use a time zone database
    const hourOffset = Math.round(longitude / 15);
    
    // Get approximate time zone based on longitude
    // Note: Etc/GMT+8 means UTC-8, Etc/GMT-8 means UTC+8 (opposite of what you'd expect)
    const tzString = `Etc/GMT${hourOffset <= 0 ? '+' : '-'}${Math.abs(hourOffset)}`;
    
    return tzString;
  } catch (error) {
    console.error("Error determining time zone:", error);
    return 'UTC';
  }
};

/**
 * Get the time zone offset in hours
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Time zone offset in hours (e.g. +8, -5)
 */
export const getTimeZoneOffsetHours = (latitude: number, longitude: number): string => {
  try {
    // Calculate offset based on longitude
    const hourOffset = Math.round(longitude / 15);
    const sign = hourOffset >= 0 ? '+' : '-';
    const absHours = Math.abs(hourOffset);
    
    // Format as +08 or -05
    return `${sign}${absHours.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error("Error getting time zone offset:", error);
    return "+00";
  }
};

/**
 * Format a date for a specific timezone
 * @param date Date to format
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param format Format string
 * @returns Formatted date string
 */
export const formatDateForTimeZone = (
  date: Date | string,
  latitude: number,
  longitude: number,
  format = 'HH:mm'
): string => {
  try {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    if (isNaN(date.getTime())) {
      return '--:--';
    }
    
    const timeZone = getTimeZoneFromCoordinates(latitude, longitude);
    return formatInTimeZone(date, timeZone, format);
  } catch (error) {
    console.error("Error formatting date for time zone:", error);
    return typeof date === 'string' ? date : date.toLocaleTimeString();
  }
};
