
import { eachDayOfInterval, format } from 'date-fns';

/**
 * Generates an array of dates from a start and end date (inclusive)
 */
export function getDatesInRange(startDate: Date, endDate: Date): Date[] {
  if (!startDate || !endDate) return [];
  
  return eachDayOfInterval({
    start: startDate,
    end: endDate
  });
}

/**
 * Groups consecutive dates to display as ranges
 * Returns an array of strings in format "May 1" or "May 1-5"
 */
export function formatDateRanges(dates: Date[]): string[] {
  if (!dates.length) return [];
  
  // Sort dates chronologically
  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  
  const ranges: string[] = [];
  let rangeStart = sortedDates[0];
  let rangeEnd = sortedDates[0];
  
  for (let i = 1; i < sortedDates.length; i++) {
    const current = sortedDates[i];
    const prev = sortedDates[i - 1];
    
    // Check if dates are consecutive
    const isConsecutive = current.getTime() - prev.getTime() === 86400000; // 24 hours in milliseconds
    
    if (isConsecutive) {
      rangeEnd = current;
    } else {
      // Add the previous range
      if (rangeStart === rangeEnd) {
        ranges.push(format(rangeStart, 'MMM d'));
      } else {
        ranges.push(`${format(rangeStart, 'MMM d')}-${format(rangeEnd, 'MMM d')}`);
      }
      
      // Start a new range
      rangeStart = current;
      rangeEnd = current;
    }
  }
  
  // Add the last range
  if (rangeStart === rangeEnd) {
    ranges.push(format(rangeStart, 'MMM d'));
  } else {
    ranges.push(`${format(rangeStart, 'MMM d')}-${format(rangeEnd, 'MMM d')}`);
  }
  
  return ranges;
}

/**
 * Groups time slots by consecutive dates
 */
export function groupTimeSlotsByConsecutiveDates(timeSlots: any[]): any[][] {
  if (!timeSlots || !timeSlots.length) return [];
  
  // Sort by start time
  const sorted = [...timeSlots].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
  
  const groups: any[][] = [];
  let currentGroup: any[] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = sorted[i - 1];
    
    const currentDate = new Date(current.start_time);
    const prevDate = new Date(prev.start_time);
    
    // Check if current date is the day after previous date
    const isNextDay = 
      currentDate.getDate() === (prevDate.getDate() + 1) &&
      currentDate.getMonth() === prevDate.getMonth() &&
      currentDate.getFullYear() === prevDate.getFullYear();
    
    // Check if time and capacity are the same
    const isSameTime = 
      format(new Date(current.start_time), 'HH:mm') === format(new Date(prev.start_time), 'HH:mm') &&
      format(new Date(current.end_time), 'HH:mm') === format(new Date(prev.end_time), 'HH:mm') &&
      current.max_capacity === prev.max_capacity;
    
    if (isNextDay && isSameTime) {
      currentGroup.push(current);
    } else {
      groups.push(currentGroup);
      currentGroup = [current];
    }
  }
  
  // Add the last group
  if (currentGroup.length) {
    groups.push(currentGroup);
  }
  
  return groups;
}
