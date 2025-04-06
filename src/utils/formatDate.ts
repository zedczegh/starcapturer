
/**
 * Format a date in a localized format
 * @param date Date to format
 * @param language Language code ('en' or 'zh')
 * @returns Formatted date string
 */
export function formatDate(date: Date, language: string = 'en'): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return language === 'en' ? 'Invalid date' : '无效日期';
  }
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  if (language === 'zh') {
    return date.toLocaleString('zh-CN', options);
  }
  
  return date.toLocaleString('en-US', options);
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 * @param date Date to format
 * @param language Language code ('en' or 'zh')
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date, language: string = 'en'): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return language === 'en' ? 'Invalid date' : '无效日期';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);
  
  // Return appropriate unit based on time difference
  if (language === 'zh') {
    if (diffSec < 60) return `${diffSec} 秒前`;
    if (diffMin < 60) return `${diffMin} 分钟前`;
    if (diffHour < 24) return `${diffHour} 小时前`;
    if (diffDay < 30) return `${diffDay} 天前`;
    if (diffMonth < 12) return `${diffMonth} 个月前`;
    return `${diffYear} 年前`;
  } else {
    if (diffSec < 60) return `${diffSec} ${diffSec === 1 ? 'second' : 'seconds'} ago`;
    if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    if (diffDay < 30) return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    if (diffMonth < 12) return `${diffMonth} ${diffMonth === 1 ? 'month' : 'months'} ago`;
    return `${diffYear} ${diffYear === 1 ? 'year' : 'years'} ago`;
  }
}
