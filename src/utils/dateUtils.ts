
/**
 * Utility functions for date formatting
 */

import { format, isValid, parseISO } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

/**
 * Format a date string for display based on the current language
 * @param dateString ISO date string
 * @param language Current app language
 * @returns Formatted date string
 */
export function formatDateForDisplay(dateString: string | undefined, language: string): string {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    
    if (!isValid(date)) return '';
    
    const locale = language === 'zh' ? zhCN : enUS;
    const formatPattern = language === 'zh' 
      ? 'yyyy年MM月dd日 HH:mm'
      : 'MMM d, yyyy h:mm a';
    
    return format(date, formatPattern, { locale });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Get relative time (e.g. "2 hours ago") based on current language
 * @param dateString ISO date string
 * @param language Current app language
 * @returns Relative time string
 */
export function getRelativeTime(dateString: string | undefined, language: string): string {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    
    if (!isValid(date)) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Less than a minute
    if (diffInSeconds < 60) {
      return language === 'zh' ? '刚刚' : 'just now';
    }
    
    // Less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return language === 'zh' 
        ? `${minutes}分钟前` 
        : `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return language === 'zh' 
        ? `${hours}小时前` 
        : `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return language === 'zh' 
        ? `${days}天前` 
        : `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    // Use the formatted date for older dates
    return formatDateForDisplay(dateString, language);
  } catch (error) {
    console.error('Error calculating relative time:', error);
    return '';
  }
}
