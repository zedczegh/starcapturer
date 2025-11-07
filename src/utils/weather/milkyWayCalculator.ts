
/**
 * Milky Way visibility calculator
 * Estimates when the Milky Way core (Sagittarius region) is visible based on location and date
 * Now properly integrated with astronomical night calculations
 * With performance optimization via caching
 */

import { calculateAstronomicalNight } from '../astronomy/nightTimeCalculator';

// Cache for Milky Way visibility calculations
const milkyWayCache = new Map<string, {
  result: {
    rise: string;
    set: string;
    duration: string;
    bestViewing: string;
    isVisible: boolean;
  },
  timestamp: number,
  validFor: number
}>();

/**
 * Calculate Milky Way visibility times with improved performance
 * @param latitude Location latitude in degrees
 * @param longitude Location longitude in degrees
 * @param date Date to calculate for (defaults to current date)
 * @returns Object with rise and set times and duration
 */
export function calculateMilkyWayVisibility(
  latitude: number,
  longitude: number,
  date = new Date()
): {
  rise: string;
  set: string;
  duration: string;
  bestViewing: string;
  isVisible: boolean;
} {
  // Generate cache key
  const dateString = date.toISOString().split('T')[0]; // Use date part only
  const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)},${dateString}`;
  
  // Check cache first
  const cachedResult = milkyWayCache.get(cacheKey);
  if (cachedResult && (Date.now() - cachedResult.timestamp) < cachedResult.validFor) {
    return cachedResult.result;
  }
  
  // The Milky Way galactic center (Sagittarius A*) precise coordinates
  // Right Ascension: 17h 45m 40.0s (266.417°) and Declination: -29° 0' 28"
  const sagittariusRA = 17.761; // decimal hours (17h 45m)
  const sagittariusDecl = -29.008; // degrees

  // Calculate Local Sidereal Time when Sagittarius rises and sets
  const LST_rise = calculateRiseSetLST(sagittariusDecl, latitude, sagittariusRA, true);
  const LST_set = calculateRiseSetLST(sagittariusDecl, latitude, sagittariusRA, false);

  // Convert LST to local time for today with proper timezone handling
  const rawRiseTime = lstToLocalTime(LST_rise, longitude, date);
  const rawSetTime = lstToLocalTime(LST_set, longitude, date);
  
  // Adjust for day boundary - if set time is before rise time, it's on the next day
  if (rawSetTime.getTime() < rawRiseTime.getTime()) {
    rawSetTime.setDate(rawSetTime.getDate() + 1);
  }

  // Get astronomical night boundaries
  const { start: nightStart, end: nightEnd } = calculateAstronomicalNight(latitude, longitude, date);
  
  // Calculate the intersection of Sagittarius visibility and astronomical night
  // Only times when BOTH conditions are met make sense
  const visibleStart = new Date(Math.max(rawRiseTime.getTime(), nightStart.getTime()));
  const visibleEnd = new Date(Math.min(rawSetTime.getTime(), nightEnd.getTime()));
  
  // Check if there's any overlap at all
  const hasOverlap = visibleEnd.getTime() > visibleStart.getTime();
  
  // Calculate actual visible duration during dark sky
  const visibleDurationMs = hasOverlap ? visibleEnd.getTime() - visibleStart.getTime() : 0;
  const visibleDurationHours = visibleDurationMs / (1000 * 60 * 60);
  
  // Format times - use actual visible window
  const riseString = hasOverlap ? formatTimeString(visibleStart) : '--:--';
  const setString = hasOverlap ? formatTimeString(visibleEnd) : '--:--';
  const bestViewing = hasOverlap ? formatTimeString(new Date((visibleStart.getTime() + visibleEnd.getTime()) / 2)) : '--:--';

  // Determine if Milky Way core is actually visible
  // Must have at least 1 hour of visibility during dark sky and be in the right season
  const month = date.getMonth();
  const isNorthern = latitude >= 0;
  
  // Core visibility is best during summer months when Sagittarius is high at night
  const isSummerMonths = isNorthern ? 
    (month >= 4 && month <= 8) : // May-Sep for Northern Hemisphere
    (month >= 10 || month <= 2);  // Nov-Mar for Southern Hemisphere
  
  // Final visibility check: must have overlap AND reasonable duration AND be in season
  let isVisible = hasOverlap && visibleDurationHours >= 1 && isSummerMonths;
  
  // Additional checks for specific conditions
  if (Math.abs(latitude) > 60) {
    // At very high latitudes, core is rarely visible
    const isPolarWinter = (isNorthern && (month >= 10 || month <= 1)) || 
                         (!isNorthern && (month >= 4 && month <= 7));
    if (isPolarWinter) {
      isVisible = false;
    }
  }
  
  // Check if Sagittarius declination makes it visible from this latitude
  // If latitude + 60° < |declination|, it never gets high enough to see well
  if (latitude < -60 || (isNorthern && latitude > 60)) {
    isVisible = false;
  }

  const result = {
    rise: riseString,
    set: setString,
    duration: hasOverlap ? formatDuration(visibleDurationHours) : '0h 0m',
    bestViewing: bestViewing,
    isVisible: isVisible
  };
  
  // Cache the result - valid for 24 hours
  milkyWayCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
    validFor: 24 * 60 * 60 * 1000
  });
  
  // Clean up cache if needed
  if (milkyWayCache.size > 100) {
    const now = Date.now();
    for (const [key, entry] of milkyWayCache.entries()) {
      if (now - entry.timestamp > entry.validFor) {
        milkyWayCache.delete(key);
      }
    }
  }

  return result;
}

/**
 * Calculate the Local Sidereal Time (LST) when a celestial object rises or sets
 * @param declination Declination of the celestial object in degrees
 * @param latitude Observer's latitude in degrees
 * @param ra Right Ascension in decimal hours
 * @param isRising true for rise time, false for set time
 * @returns Local Sidereal Time in decimal hours (0-24)
 */
function calculateRiseSetLST(declination: number, latitude: number, ra: number, isRising: boolean): number {
  // Convert to radians
  const decl = (declination * Math.PI) / 180;
  const lat = (latitude * Math.PI) / 180;
  
  // Calculate hour angle (HA)
  // Objects rise when HA = -H and set when HA = +H
  // where cos H = -tan(lat) * tan(decl)
  const tanLat = Math.tan(lat);
  const tanDecl = Math.tan(decl);
  
  // Check for circumpolar or never-visible conditions
  const cosH = -tanLat * tanDecl;
  
  if (Math.abs(cosH) > 1) {
    // Object never rises/sets at this latitude (circumpolar or never visible)
    // Check if it's always above horizon (circumpolar) or always below (never visible)
    const isCircumpolar = latitude * declination > 0 && Math.abs(declination) > (90 - Math.abs(latitude));
    
    if (isCircumpolar) {
      // Object is circumpolar (always above horizon)
      return isRising ? 0 : 12; // Use conventional values
    } else {
      // Object is never visible (always below horizon)
      return isRising ? 0 : 12; // Use conventional values
    }
  }
  
  // Calculate hour angle in radians
  const H = Math.acos(cosH);
  
  // Convert hour angle to hours (0-24)
  const hourAngle = (H * 12) / Math.PI;
  
  // Calculate LST: RA ± Hour Angle (- for rising, + for setting)
  let LST = isRising ? ra - hourAngle : ra + hourAngle;
  
  // Normalize to 0-24 range
  while (LST < 0) LST += 24;
  while (LST >= 24) LST -= 24;
  
  return LST;
}

/**
 * Convert Local Sidereal Time to local time
 * @param LST Local Sidereal Time in decimal hours
 * @param longitude Observer's longitude in degrees (positive East, negative West)
 * @param date Date to calculate for
 * @returns Date object representing the local time
 */
function lstToLocalTime(LST: number, longitude: number, date: Date): Date {
  // Get the Greenwich Mean Sidereal Time (GMST) at 0h UT for the date
  const GMST0 = calculateGMST0(date);
  
  // Calculate the LST at Greenwich (GMST) for the given LST at the observer's location
  // LST = GMST + longitude/15 (longitude in hours)
  // So GMST = LST - longitude/15
  const longitudeHours = longitude / 15.0;
  
  // Calculate UT: The time when the given LST occurs
  // GMST = GMST0 + UT * 1.00273790935 (sidereal day is ~23h 56m 4s)
  // UT = (LST - longitudeHours - GMST0) / 1.00273790935
  let UT = (LST - longitudeHours - GMST0) / 1.00273790935;
  
  // Normalize to 0-24 range
  while (UT < 0) UT += 24;
  while (UT >= 24) UT -= 24;
  
  // Create a local date object for today at midnight
  const localDate = new Date(date);
  localDate.setHours(0, 0, 0, 0);
  
  // Add the calculated hours to get the local time
  // This preserves the local timezone
  const hours = Math.floor(UT);
  const minutes = Math.round((UT % 1) * 60);
  
  localDate.setHours(hours, minutes, 0, 0);
  
  return localDate;
}

/**
 * Calculate Greenwich Mean Sidereal Time at 0h UT
 * @param date Date to calculate for
 * @returns GMST in hours
 */
function calculateGMST0(date: Date): number {
  // Get Julian Date for 0h UT on the given date
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Calculate JD for 0h UT
  let JD0;
  
  if (month <= 2) {
    JD0 = Math.floor(365.25 * (year - 1)) + 
          Math.floor(30.6001 * (month + 12)) + 
          day + 1720981.5;
  } else {
    JD0 = Math.floor(365.25 * year) + 
          Math.floor(30.6001 * (month + 1)) + 
          day + 1720981.5;
  }
  
  // Calculate T (centuries since J2000.0)
  const T = (JD0 - 2451545.0) / 36525;
  
  // Calculate GMST at 0h UT using more precise formula
  let GMST = 100.46061837 + 36000.770053608 * T + 0.000387933 * T * T - 
             T * T * T / 38710000.0;
             
  // Convert to hours (GMST is in degrees)
  GMST = GMST / 15.0;
  
  // Normalize to 0-24 range
  GMST = GMST % 24;
  if (GMST < 0) GMST += 24;
  
  return GMST;
}

/**
 * Format a date as a time string
 * @param date Date to format
 * @returns Time string in HH:MM format
 */
function formatTimeString(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format duration in hours to a string
 * @param hours Duration in decimal hours
 * @returns Formatted duration string (e.g., "5h 30m")
 */
function formatDuration(hours: number): string {
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
}
