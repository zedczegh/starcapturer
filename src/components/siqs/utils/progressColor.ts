
/**
 * Utility functions for managing progress bar colors based on SIQS scores
 */

/**
 * Get the appropriate color class for a progress bar based on the value
 * @param value The value to check (0-10 scale)
 * @param isReversed Whether higher values are worse (true) or better (false)
 * @returns Tailwind CSS class string for the color
 */
export function getProgressColor(value: number, isReversed: boolean = false): string {
  // Normalize to 0-10 scale
  const normalizedValue = value > 10 ? value / 10 : value;
  
  // For reversed scales (like light pollution or cloud cover, where higher is worse)
  if (isReversed) {
    if (normalizedValue >= 8) return "bg-red-500";
    if (normalizedValue >= 6) return "bg-orange-500";
    if (normalizedValue >= 4) return "bg-yellow-400";
    if (normalizedValue >= 2) return "bg-lime-500";
    return "bg-green-500";
  }
  
  // For normal scales (like SIQS, where higher is better)
  if (normalizedValue >= 8) return "bg-green-500";
  if (normalizedValue >= 6) return "bg-gradient-to-r from-[#8A9A5B] to-[#606C38]";
  if (normalizedValue >= 4) return "bg-yellow-400";
  if (normalizedValue >= 2) return "bg-orange-500";
  return "bg-red-500";
}

/**
 * Get the width percentage for a progress bar
 * @param value Current value
 * @param max Maximum possible value
 * @returns Width as percentage string
 */
export function getProgressWidth(value: number, max: number = 10): string {
  // Ensure value is between 0 and max
  const clampedValue = Math.max(0, Math.min(value, max));
  return `${(clampedValue / max) * 100}%`;
}

/**
 * Get color class for SIQS score text
 * @param score SIQS score (0-10)
 * @returns Tailwind text color class
 */
export function getSIQSTextColor(score: number): string {
  if (score >= 8) return "text-green-500";
  if (score >= 6) return "text-lime-500";
  if (score >= 4) return "text-yellow-500";
  if (score >= 2) return "text-orange-500";
  return "text-red-500";
}

/**
 * Get a detailed description for condition indicators
 * @param condition The condition type (e.g., 'cloud', 'bortle', etc.)
 * @param value The value of the condition
 * @param language The user's language preference
 * @returns Description of the condition's impact
 */
export function getConditionDescription(condition: string, value: number, language: string = 'en'): string {
  // English and Chinese descriptions
  const descriptions: Record<string, Record<string, string[]>> = {
    'cloud': {
      'en': ['Excellent', 'Good', 'Moderate', 'Poor', 'Very Poor'],
      'zh': ['极佳', '良好', '一般', '较差', '很差']
    },
    'bortle': {
      'en': ['Dark Sky', 'Rural', 'Suburban', 'Urban Fringe', 'City Center'],
      'zh': ['黑暗天空', '乡村', '郊区', '城市边缘', '市中心']
    },
    'wind': {
      'en': ['Very Calm', 'Calm', 'Moderate', 'Windy', 'Very Windy'],
      'zh': ['非常平静', '平静', '一般', '有风', '非常有风']
    },
    'seeing': {
      'en': ['Excellent', 'Good', 'Average', 'Below Average', 'Poor'],
      'zh': ['极佳', '良好', '一般', '较差', '很差']
    }
  };
  
  // Normalize value to 0-10 scale
  const normalizedValue = value > 10 ? value / 10 : value;
  
  // Get the appropriate description based on value
  const descList = descriptions[condition]?.[language === 'zh' ? 'zh' : 'en'] || 
                  descriptions[condition]?.['en'] || 
                  ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'];
  
  if (normalizedValue >= 8) return descList[0];
  if (normalizedValue >= 6) return descList[1];
  if (normalizedValue >= 4) return descList[2];
  if (normalizedValue >= 2) return descList[3];
  return descList[4];
}
