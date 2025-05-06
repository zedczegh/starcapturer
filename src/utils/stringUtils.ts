
/**
 * Returns the initials from a name (up to 2 characters)
 */
export const getInitials = (name: string | null): string => {
  if (!name) return "?";
  
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Safely converts a value to a string
 */
export const safeToString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

/**
 * Returns a truncated version of a string if it exceeds maxLength
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (!str || str.length <= maxLength) return str || '';
  return `${str.substring(0, maxLength)}...`;
};

/**
 * Safely gets the first character of a string
 */
export const getFirstChar = (str: string | null | undefined): string => {
  if (!str) return '?';
  return str.charAt(0).toUpperCase();
};
