
/**
 * Utility functions for string manipulation
 */

/**
 * Get initials from a name (first letter of first and last name)
 * @param name Full name
 * @returns Initials (1-2 characters)
 */
export const getInitials = (name: string): string => {
  if (!name) return '?';
  
  const names = name.trim().split(' ');
  
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

/**
 * Truncate a string to a specified length and add ellipsis if needed
 * @param str String to truncate
 * @param maxLength Maximum length
 * @returns Truncated string
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};
