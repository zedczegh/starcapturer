
/**
 * Get initials from a name string
 * @param name The name to get initials from
 * @returns The first letter of first and last name, or first two letters if only one word
 */
export const getInitials = (name: string): string => {
  if (!name) return '';
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 0) return '';
  
  if (parts.length === 1) {
    // If single word, return first two letters or just first if it's a single letter
    return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  }
  
  // Return first letter of first word + first letter of last word
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
