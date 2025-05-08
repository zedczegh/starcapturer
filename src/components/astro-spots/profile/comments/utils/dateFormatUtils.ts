
import { formatDistanceToNow } from 'date-fns';

/**
 * Format a date string into a relative time string (e.g. "2 days ago")
 */
export const getFormattedDate = (dateString: string): string => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch (error) {
    console.error("Invalid date format:", dateString, error);
    return "recently";
  }
};
