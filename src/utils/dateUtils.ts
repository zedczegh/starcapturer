
import { format, parseISO } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';

/**
 * Formats a date string for display according to the user's language preference
 * @param dateString ISO date string to format
 * @param language Language code ('en' or 'zh')
 * @returns Formatted date string
 */
export const formatDateForDisplay = (dateString: string | undefined, language: string = 'en'): string => {
  if (!dateString) return '';
  
  try {
    const date = parseISO(dateString);
    const locale = language === 'zh' ? zhCN : enUS;
    
    // Use different date formats based on language
    if (language === 'zh') {
      return format(date, 'yyyy年MM月dd日 HH:mm', { locale });
    } else {
      return format(date, 'MMM d, yyyy h:mm a', { locale });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Formats a date for use in API requests (ISO format)
 * @param date Date object to format
 * @returns ISO formatted date string
 */
export const formatDateForApi = (date: Date): string => {
  try {
    return date.toISOString();
  } catch (error) {
    console.error('Error formatting date for API:', error);
    return '';
  }
};
