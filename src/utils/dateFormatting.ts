
import { Language } from '@/contexts/LanguageContext';

/**
 * Format a date according to the current language
 * @param date Date to format
 * @param language Current language
 * @returns Formatted date string
 */
export function formatDateForLanguage(date: string | Date, language: Language): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  try {
    if (language === 'zh') {
      // Chinese format: YYYY年MM月DD日
      return dateObj.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      // English format: Month DD, YYYY
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error("Error formatting date:", error);
    // Fallback to ISO string format
    return dateObj.toISOString().split('T')[0];
  }
}

/**
 * Format a date range in a user friendly way
 * @param startDate Check-in date
 * @param endDate Check-out date
 * @param language Current language
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: Date | null, endDate: Date | null, language: Language): string {
  if (!startDate && !endDate) {
    return language === 'zh' ? '选择日期' : 'Select dates';
  }
  
  if (startDate && !endDate) {
    return `${formatDateForLanguage(startDate, language)} ${language === 'zh' ? '→' : 'to'} ?`;
  }
  
  if (startDate && endDate) {
    return `${formatDateForLanguage(startDate, language)} ${language === 'zh' ? '→' : 'to'} ${formatDateForLanguage(endDate, language)}`;
  }
  
  return '';
}
