
/**
 * Date and time utility functions for formatting and displaying dates
 */

/**
 * Get relative time text from a timestamp (e.g., "2 hours ago")
 * @param timestamp ISO timestamp string
 * @param isChinese Whether to use Chinese language
 * @returns Formatted relative time string
 */
export function getRelativeTimeText(timestamp: string, isChinese = false): string {
  if (!timestamp) {
    return isChinese ? '未知时间' : 'Unknown time';
  }
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Handle invalid dates
    if (isNaN(date.getTime())) {
      return isChinese ? '未知时间' : 'Unknown time';
    }
    
    // Less than a minute
    if (diffInSeconds < 60) {
      return isChinese ? '刚刚' : 'Just now';
    }
    
    // Less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return isChinese 
        ? `${minutes} 分钟前` 
        : `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return isChinese 
        ? `${hours} 小时前` 
        : `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return isChinese 
        ? `${days} 天前` 
        : `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a month
    if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return isChinese 
        ? `${weeks} 周前` 
        : `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a year
    if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return isChinese 
        ? `${months} 个月前` 
        : `${months} month${months !== 1 ? 's' : ''} ago`;
    }
    
    // More than a year
    const years = Math.floor(diffInSeconds / 31536000);
    return isChinese 
      ? `${years} 年前` 
      : `${years} year${years !== 1 ? 's' : ''} ago`;
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return isChinese ? '未知时间' : 'Unknown time';
  }
}

/**
 * Format date to a localized string
 * @param dateStr Date string or timestamp
 * @param isChinese Whether to use Chinese language
 * @returns Formatted date string
 */
export function formatDate(dateStr: string, isChinese = false): string {
  if (!dateStr) {
    return isChinese ? '未知日期' : 'Unknown date';
  }
  
  try {
    const date = new Date(dateStr);
    
    // Handle invalid dates
    if (isNaN(date.getTime())) {
      return isChinese ? '未知日期' : 'Unknown date';
    }
    
    if (isChinese) {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error("Error formatting date:", error);
    return isChinese ? '未知日期' : 'Unknown date';
  }
}
