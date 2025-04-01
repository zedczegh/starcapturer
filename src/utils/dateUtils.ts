
/**
 * Format date in a user-friendly way
 * @param date Date to format
 * @param isChineseFormat Whether to use Chinese date format
 * @returns Formatted date string
 */
export function formatDate(date: Date, isChineseFormat: boolean = false): string {
  if (!date || isNaN(date.getTime())) {
    return isChineseFormat ? '未知日期' : 'Unknown date';
  }
  
  try {
    if (isChineseFormat) {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }
    
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return isChineseFormat ? '日期格式错误' : 'Date format error';
  }
}

/**
 * Get relative time text from timestamp
 * @param timestamp ISO timestamp string
 * @param isChineseFormat Whether to use Chinese text format
 * @returns Relative time text like "2 days ago"
 */
export function getRelativeTimeText(timestamp: string, isChineseFormat: boolean = false): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (isChineseFormat) {
      if (diffMinutes < 1) return '刚刚';
      if (diffMinutes < 60) return `${diffMinutes}分钟前`;
      if (diffHours < 24) return `${diffHours}小时前`;
      if (diffDays < 30) return `${diffDays}天前`;
      return formatDate(date, true);
    } else {
      if (diffMinutes < 1) return 'just now';
      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      return formatDate(date, false);
    }
  } catch (error) {
    console.error('Error getting relative time:', error);
    return isChineseFormat ? '未知时间' : 'unknown time';
  }
}
