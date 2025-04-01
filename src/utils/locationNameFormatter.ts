
/**
 * Format location names for display based on language and preferences
 */

/**
 * Format location name for display
 * @param name Original location name
 * @param language Current language (en or zh)
 * @returns Formatted location name for display
 */
export function formatLocationName(name: string, language: string): string {
  if (!name) return language === 'zh' ? '未知位置' : 'Unknown location';
  
  // For English language
  if (language === 'en') {
    // Remove coordinates if they're present in name
    if (name.includes('°')) {
      return 'Astronomy Point';
    }
    
    // Check if it's a generated location name
    if (name.startsWith('Location at')) {
      const parts = name.split(', ');
      if (parts.length > 1) {
        return parts[1];
      }
      return 'Astronomy Point';
    }
    
    return name;
  } 
  // For Chinese language
  else {
    // Remove coordinates if they're present in name
    if (name.includes('°')) {
      return '天文观测点';
    }
    
    // Check if it's a generated location name
    if (name.startsWith('Location at') || name.startsWith('位置在')) {
      return '天文观测点';
    }
    
    return name;
  }
}

/**
 * Format a location name to be displayed as a page title
 * @param name Original location name
 * @param language Current language (en or zh)
 * @returns Formatted page title
 */
export function formatLocationPageTitle(name: string, language: string): string {
  const formatted = formatLocationName(name, language);
  
  if (language === 'en') {
    return `${formatted} | Sky Viewer`;
  } else {
    return `${formatted} | 天空观测`;
  }
}
