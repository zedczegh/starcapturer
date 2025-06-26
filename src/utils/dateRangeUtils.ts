
import { format, parseISO, isValid } from 'date-fns';

export function formatDateRanges(timeSlots: any[]): string {
  if (!timeSlots || timeSlots.length === 0) {
    return '';
  }

  // Convert and validate dates, then sort
  const validSlots = timeSlots
    .map(slot => {
      let startDate: Date;
      let endDate: Date;

      // Handle different date formats
      if (typeof slot.start_time === 'string') {
        startDate = parseISO(slot.start_time);
      } else if (slot.start_time instanceof Date) {
        startDate = slot.start_time;
      } else {
        return null; // Invalid date
      }

      if (typeof slot.end_time === 'string') {
        endDate = parseISO(slot.end_time);
      } else if (slot.end_time instanceof Date) {
        endDate = slot.end_time;
      } else {
        return null; // Invalid date
      }

      // Validate dates
      if (!isValid(startDate) || !isValid(endDate)) {
        return null;
      }

      return {
        ...slot,
        parsedStartDate: startDate,
        parsedEndDate: endDate
      };
    })
    .filter(slot => slot !== null) // Remove invalid slots
    .sort((a, b) => a.parsedStartDate.getTime() - b.parsedStartDate.getTime());

  if (validSlots.length === 0) {
    return 'No valid dates';
  }

  if (validSlots.length === 1) {
    return format(validSlots[0].parsedStartDate, 'MMM dd, yyyy');
  }

  // Group consecutive dates
  const ranges: string[] = [];
  let rangeStart = validSlots[0].parsedStartDate;
  let rangeEnd = validSlots[0].parsedStartDate;

  for (let i = 1; i < validSlots.length; i++) {
    const currentDate = validSlots[i].parsedStartDate;
    const prevDate = validSlots[i - 1].parsedStartDate;
    
    // Check if dates are consecutive (within 1 day)
    const daysDiff = Math.abs(currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 1) {
      rangeEnd = currentDate;
    } else {
      // End current range and start new one
      if (rangeStart.getTime() === rangeEnd.getTime()) {
        ranges.push(format(rangeStart, 'MMM dd, yyyy'));
      } else {
        ranges.push(`${format(rangeStart, 'MMM dd')} - ${format(rangeEnd, 'MMM dd, yyyy')}`);
      }
      rangeStart = currentDate;
      rangeEnd = currentDate;
    }
  }

  // Add final range
  if (rangeStart.getTime() === rangeEnd.getTime()) {
    ranges.push(format(rangeStart, 'MMM dd, yyyy'));
  } else {
    ranges.push(`${format(rangeStart, 'MMM dd')} - ${format(rangeEnd, 'MMM dd, yyyy')}`);
  }

  return ranges.join(', ');
}
