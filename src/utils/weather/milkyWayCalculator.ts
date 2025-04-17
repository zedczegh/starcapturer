
/**
 * Milky Way visibility calculator
 * Estimates when the Milky Way core (Sagittarius region) is visible based on location and date
 */

/**
 * Calculate Milky Way visibility times
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
  // The Milky Way core (Sagittarius) has approximately these coordinates
  // Right Ascension ~18h (270°) and Declination ~-27°
  const sagittariusRA = 270; // degrees
  const sagittariusDecl = -27; // degrees

  // Convert to date to day of year
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Seasonal adjustment - the Milky Way's position changes throughout the year
  // Season affects viewing times (best in summer for northern hemisphere)
  const seasonalOffset = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 2;

  // Calculate Local Sidereal Time when Sagittarius rises and sets
  const LST_rise = calculateRiseSetLST(sagittariusDecl, latitude, true);
  const LST_set = calculateRiseSetLST(sagittariusDecl, latitude, false);

  // Convert LST to local time for today
  const riseTime = lstToLocalTime(LST_rise, longitude, date);
  const setTime = lstToLocalTime(LST_set, longitude, date);

  // Adjust times based on season for better accuracy
  riseTime.setHours(riseTime.getHours() + seasonalOffset);
  setTime.setHours(setTime.getHours() + seasonalOffset);

  // Format times
  const riseString = formatTimeString(riseTime);
  const setString = formatTimeString(setTime);

  // Calculate duration
  let durationMs = setTime.getTime() - riseTime.getTime();
  if (durationMs < 0) durationMs += 24 * 60 * 60 * 1000; // Add 24 hours if set is on next day
  const durationHours = durationMs / (1000 * 60 * 60);

  // Determine if Milky Way core is visible tonight
  // Core is best visible during dark nights in summer months
  const month = date.getMonth();
  const isNorthern = latitude >= 0;
  const isSummerMonths = isNorthern ? 
    (month >= 3 && month <= 8) : // Apr-Sep for Northern Hemisphere
    (month >= 9 || month <= 2);  // Oct-Mar for Southern Hemisphere

  // Determine best viewing time - typically middle of the visibility window
  const midPoint = new Date((riseTime.getTime() + setTime.getTime()) / 2);
  const bestViewing = formatTimeString(midPoint);

  // Check if latitude is too far north where Sagittarius might not rise
  const isVisible = Math.abs(latitude) < 63 && isSummerMonths;

  return {
    rise: riseString,
    set: setString,
    duration: formatDuration(durationHours),
    bestViewing: bestViewing,
    isVisible: isVisible
  };
}

/**
 * Calculate the Local Sidereal Time (LST) when a celestial object rises or sets
 * @param declination Declination of the celestial object in degrees
 * @param latitude Observer's latitude in degrees
 * @param isRising true for rise time, false for set time
 * @returns Local Sidereal Time in decimal hours (0-24)
 */
function calculateRiseSetLST(declination: number, latitude: number, isRising: boolean): number {
  // Convert to radians
  const decl = (declination * Math.PI) / 180;
  const lat = (latitude * Math.PI) / 180;
  
  // Calculate hour angle (HA)
  // Objects rise when HA = -H and set when HA = +H
  // where cos H = -tan(lat) * tan(decl)
  const tanLat = Math.tan(lat);
  const tanDecl = Math.tan(decl);
  
  // For extreme latitudes or declinations, this can be impossible (object always above/below horizon)
  // Handle that case by returning appropriate values
  if (Math.abs(tanLat * tanDecl) > 1) {
    // Object never rises/sets at this latitude
    return isRising ? 0 : 12; // Default values
  }
  
  // Calculate hour angle in radians
  const H = Math.acos(-tanLat * tanDecl);
  
  // Convert hour angle to hours (0-24)
  const hourAngle = (H * 12) / Math.PI;
  
  // Calculate LST: RA ± Hour Angle (+ for setting, - for rising)
  const RA = 18; // Sagittarius is around 18h Right Ascension
  let LST = isRising ? RA - hourAngle : RA + hourAngle;
  
  // Normalize to 0-24 range
  while (LST < 0) LST += 24;
  while (LST >= 24) LST -= 24;
  
  return LST;
}

/**
 * Convert Local Sidereal Time to local time
 * @param LST Local Sidereal Time in decimal hours
 * @param longitude Observer's longitude in degrees
 * @param date Date to calculate for
 * @returns Date object representing the local time
 */
function lstToLocalTime(LST: number, longitude: number, date: Date): Date {
  // Get the Greenwich Mean Sidereal Time (GMST) at 0h UT for the date
  const GMST0 = calculateGMST0(date);
  
  // Calculate UT when LST occurs
  let UT = (LST - GMST0 - longitude/15) * 0.9972;
  
  // Normalize to 0-24 range
  while (UT < 0) UT += 24;
  while (UT >= 24) UT -= 24;
  
  // Convert to local time by applying timezone offset
  const localTime = new Date(date);
  localTime.setUTCHours(0, 0, 0, 0); // Set to midnight UTC
  localTime.setUTCHours(UT); // Add calculated UT hours
  
  return localTime;
}

/**
 * Calculate Greenwich Mean Sidereal Time at 0h UT
 * @param date Date to calculate for
 * @returns GMST in hours
 */
function calculateGMST0(date: Date): number {
  // Get Julian Date
  const JD = getJulianDate(date);
  const T = (JD - 2451545.0) / 36525;
  
  // Calculate GMST at 0h UT
  let GMST = 6.697374558 + 0.06570982441908 * 36525 * T;
  GMST = GMST % 24;
  
  if (GMST < 0) GMST += 24;
  
  return GMST;
}

/**
 * Calculate Julian Date
 * @param date Date object
 * @returns Julian Date
 */
function getJulianDate(date: Date): number {
  // Get year, month, day, and decimal day
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-based
  const day = date.getDate();
  
  // Calculate Julian Date
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  
  const JD = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 
            Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  
  return JD;
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
