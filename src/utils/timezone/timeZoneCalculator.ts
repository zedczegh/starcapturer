
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { addDays } from 'date-fns';

interface NightPeriod {
  start: Date;
  end: Date;
  isNighttime: boolean;
  timeUntilNight?: number; // minutes until night starts
  timeUntilDaylight?: number; // minutes until daylight starts
}

export function getLocationTimeInfo(latitude: number, longitude: number): NightPeriod {
  // Get timezone for the location
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Get current time in location's timezone
  const now = new Date();
  const localTime = toZonedTime(now, timezone);
  
  // Format local date string for comparisons
  const currentHour = localTime.getHours();
  
  // Define night period (6 PM to 7 AM next day)
  const todayNightStart = new Date(localTime);
  todayNightStart.setHours(18, 0, 0, 0);
  
  const tomorrowDayStart = addDays(new Date(localTime), 1);
  tomorrowDayStart.setHours(7, 0, 0, 0);
  
  // Check if we're in nighttime (between 18:00 and 07:00)
  const isNighttime = currentHour >= 18 || currentHour < 7;
  
  // Calculate time differences
  let timeUntilNight: number | undefined;
  let timeUntilDaylight: number | undefined;
  
  if (!isNighttime) {
    // If it's daytime, calculate minutes until night
    timeUntilNight = Math.round((todayNightStart.getTime() - localTime.getTime()) / (1000 * 60));
  } else if (currentHour >= 18) {
    // If it's night but before midnight
    timeUntilDaylight = Math.round((tomorrowDayStart.getTime() - localTime.getTime()) / (1000 * 60));
  } else {
    // If it's night after midnight
    const todayDayStart = new Date(localTime);
    todayDayStart.setHours(7, 0, 0, 0);
    timeUntilDaylight = Math.round((todayDayStart.getTime() - localTime.getTime()) / (1000 * 60));
  }
  
  return {
    start: todayNightStart,
    end: tomorrowDayStart,
    isNighttime,
    timeUntilNight,
    timeUntilDaylight
  };
}

export function getLocationFormattedTime(latitude: number, longitude: number): string {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  return formatInTimeZone(now, timezone, 'HH:mm');
}
