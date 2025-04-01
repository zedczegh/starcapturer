
/**
 * Utility for formatting location names consistently
 * Handles special cases and language-specific formatting
 */

/**
 * Format a location name for display
 * @param name Raw location name
 * @param language Current language (en or zh)
 * @returns Formatted location name
 */
export function formatLocationName(name: string, language?: string): string {
  if (!name) return '';
  
  // If we have Chinese characters and language is not Chinese, use default handling
  const hasChinese = /[\u4e00-\u9fa5]/.test(name);
  if (hasChinese && language !== 'zh') {
    return name;
  }
  
  // Remove unnecessary prefixes/suffixes
  let formatted = name
    .replace(/^location at /i, '')
    .replace(/^dark sky /i, '')
    .replace(/international dark sky /i, '')
    .trim();
  
  // Capitalize words
  formatted = formatted
    .split(' ')
    .map(word => {
      // Don't capitalize certain small words unless they're the first word
      const smallWords = ['a', 'an', 'the', 'in', 'on', 'at', 'by', 'for', 'of', 'and', 'or'];
      if (smallWords.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
  
  // Ensure first letter is capitalized
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  
  return formatted;
}

/**
 * Format certification type for UI display
 * @param certification Raw certification type from API
 * @param language Current language (en or zh)
 * @returns Formatted certification type
 */
export function formatCertificationType(certification: string | undefined, language?: string): string {
  if (!certification) return '';
  
  // Chinese translations
  if (language === 'zh') {
    if (certification.includes('Sanctuary')) return '国际暗夜保护区';
    if (certification.includes('Reserve')) return '国际暗夜保护区';
    if (certification.includes('Park')) return '国际暗夜公园';
    if (certification.includes('Community')) return '国际暗夜社区';
    if (certification.includes('Urban')) return '城市夜空地点';
    return '认证暗夜地点';
  }
  
  // For English, use a shorter version
  if (certification.includes('International Dark Sky')) {
    return certification.replace('International Dark Sky', 'Dark Sky');
  }
  
  return certification;
}
