
import { format, parseISO } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

/**
 * Format a date with localization support
 */
export const formatDate = (
  dateString: string,
  formatString: string = 'MMM d',
  language: string = 'en'
): string => {
  try {
    const date = parseISO(dateString);
    return format(date, formatString, {
      locale: language === 'zh' ? zhCN : enUS
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Format time with localization support
 */
export const formatTime = (
  dateString: string,
  formatString: string = 'HH:mm',
  language: string = 'en'
): string => {
  try {
    const date = parseISO(dateString);
    return format(date, formatString, {
      locale: language === 'zh' ? zhCN : enUS
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return dateString;
  }
};

/**
 * Get day of week with localization support
 */
export const getDayOfWeek = (
  dateString: string,
  language: string = 'en'
): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'EEEE', {
      locale: language === 'zh' ? zhCN : enUS
    });
  } catch (error) {
    console.error('Error getting day of week:', error);
    return '';
  }
};

/**
 * Get short day of week with localization support
 */
export const getShortDayOfWeek = (
  dateString: string,
  language: string = 'en'
): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'EEE', {
      locale: language === 'zh' ? zhCN : enUS
    });
  } catch (error) {
    console.error('Error getting short day of week:', error);
    return '';
  }
};

/**
 * Check if a date is today
 */
export const isToday = (dateString: string): boolean => {
  try {
    const date = parseISO(dateString);
    const today = new Date();
    
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    console.error('Error checking if date is today:', error);
    return false;
  }
};
