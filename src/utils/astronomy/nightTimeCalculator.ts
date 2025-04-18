
/**
 * Astronomical night time calculator
 * Calculates the duration of astronomical night for a given location and date
 */

/**
 * Calculate sunrise and sunset times for a location
 * @param latitude Latitude in decimal degrees
 * @param longitude Longitude in decimal degrees
 * @param date Date to calculate for (defaults to current date)
 * @returns Object with sunrise and sunset times as Date objects
 */
export function calculateSunriseSunset(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): { sunrise: Date; sunset: Date } {
  // Initialize date copies to avoid mutation
  const sunriseDate = new Date(date);
  const sunsetDate = new Date(date);
  
  // Get day of year (1-366)
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Calculate solar declination
  const declination = -23.45 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));
  
  // Calculate sunrise and sunset hour angles
  const sunriseHourAngle = Math.acos(
    -Math.tan(toRadians(latitude)) * Math.tan(toRadians(declination))
  );
  
  // Convert hour angle to hours
  const sunriseHour = 12 - toDegrees(sunriseHourAngle) / 15;
  const sunsetHour = 12 + toDegrees(sunriseHourAngle) / 15;
  
  // Apply longitude correction (4 minutes per degree)
  const longitudeCorrection = (longitude % 15) * 4 / 60; // in hours
  const timeZoneOffset = date.getTimezoneOffset() / 60;
  
  // Set sunrise and sunset times
  sunriseDate.setHours(
    Math.floor(sunriseHour - timeZoneOffset - longitudeCorrection),
    Math.round((sunriseHour - Math.floor(sunriseHour - timeZoneOffset - longitudeCorrection)) * 60),
    0
  );
  
  sunsetDate.setHours(
    Math.floor(sunsetHour - timeZoneOffset - longitudeCorrection),
    Math.round((sunsetHour - Math.floor(sunsetHour - timeZoneOffset - longitudeCorrection)) * 60),
    0
  );
  
  return { sunrise: sunriseDate, sunset: sunsetDate };
}

/**
 * Calculate astronomical night start and end times
 * Astronomical night is when the sun is 18 degrees below the horizon
 * @param latitude Latitude in decimal degrees
 * @param longitude Longitude in decimal degrees
 * @param date Date to calculate for (defaults to current date)
 * @returns Object with night start and end times as Date objects
 */
export function calculateAstronomicalNight(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): { start: Date; end: Date } {
  // Get basic sunrise/sunset
  const { sunrise, sunset } = calculateSunriseSunset(latitude, longitude, date);
  
  // Astronomical twilight starts/ends when sun is 18 degrees below horizon
  // Approximately 1.5 hours after sunset / before sunrise
  const nightStart = new Date(sunset);
  nightStart.setMinutes(nightStart.getMinutes() + 90); // 1.5 hours after sunset
  
  const nightEnd = new Date(sunrise);
  nightEnd.setMinutes(nightEnd.getMinutes() - 90); // 1.5 hours before sunrise
  
  // In extreme latitudes during summer, there might be no astronomical night
  // In that case, use civil twilight (6 degrees below horizon)
  if (nightEnd <= nightStart) {
    // No astronomical night, use civil twilight
    const civilNightStart = new Date(sunset);
    civilNightStart.setMinutes(civilNightStart.getMinutes() + 30); // 30 minutes after sunset
    
    const civilNightEnd = new Date(sunrise);
    civilNightEnd.setMinutes(civilNightEnd.getMinutes() - 30); // 30 minutes before sunrise
    
    return { start: civilNightStart, end: civilNightEnd };
  }
  
  return { start: nightStart, end: nightEnd };
}

/**
 * Get night hours for a specific location and date
 * @param latitude Latitude in decimal degrees
 * @param longitude Longitude in decimal degrees
 * @param date Date to calculate for (defaults to current date)
 * @returns Array of hours during the astronomical night
 */
export function getNightHours(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): number[] {
  const { start, end } = calculateAstronomicalNight(latitude, longitude, date);
  const nightHours = [];
  
  // Create a copy of start time
  const time = new Date(start);
  
  // Add each hour until we reach end time
  while (time < end) {
    nightHours.push(time.getHours());
    time.setHours(time.getHours() + 1);
  }
  
  return nightHours;
}

/**
 * Format time as HH:MM
 * @param date Date object
 * @returns Formatted time string
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Check if current time is during astronomical night
 * @param latitude Latitude in decimal degrees
 * @param longitude Longitude in decimal degrees
 * @returns Boolean indicating if it's currently night time
 */
export function isNighttime(latitude: number, longitude: number): boolean {
  const now = new Date();
  const { start, end } = calculateAstronomicalNight(latitude, longitude, now);
  return now >= start && now <= end;
}

/**
 * Helper function to convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Helper function to convert radians to degrees
 * @param radians Angle in radians
 * @returns Angle in degrees
 */
function toDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}
