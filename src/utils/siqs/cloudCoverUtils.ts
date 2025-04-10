
/**
 * Validate and normalize cloud cover value
 * @param cloudCover Raw cloud cover value
 * @returns Normalized cloud cover percentage (0-100)
 */
export function validateCloudCover(cloudCover: any): number {
  if (cloudCover === null || cloudCover === undefined) {
    return 50; // Default value
  }
  
  const numValue = Number(cloudCover);
  
  if (isNaN(numValue)) {
    return 50; // Default for invalid values
  }
  
  // Ensure value is in 0-100 range
  return Math.max(0, Math.min(100, numValue));
}

/**
 * Get cloud cover description based on percentage
 * @param cloudCover Cloud cover percentage
 * @returns Description string
 */
export function getCloudCoverDescription(cloudCover: number, language: string = 'en'): string {
  const validCloudCover = validateCloudCover(cloudCover);
  
  if (validCloudCover === 0) {
    return language === 'zh' ? '完全晴朗无云' : 'Clear skies (0%)';
  } else if (validCloudCover < 10) {
    return language === 'zh' ? `几乎晴朗 (${validCloudCover}%)` : `Nearly clear (${validCloudCover}%)`;
  } else if (validCloudCover < 30) {
    return language === 'zh' ? `少量云层 (${validCloudCover}%)` : `Light clouds (${validCloudCover}%)`;
  } else if (validCloudCover < 50) {
    return language === 'zh' ? `部分多云 (${validCloudCover}%)` : `Partly cloudy (${validCloudCover}%)`;
  } else if (validCloudCover < 80) {
    return language === 'zh' ? `较多云层 (${validCloudCover}%)` : `Mostly cloudy (${validCloudCover}%)`;
  } else if (validCloudCover < 100) {
    return language === 'zh' 
      ? `重度云层 (${validCloudCover}%), 不适合成像`
      : `Heavy cloud cover (${validCloudCover}%), not suitable for imaging`;
  } else {
    return language === 'zh' 
      ? '完全被云层覆盖 (100%), 不适合任何天文观测'
      : 'Complete overcast (100%), not suitable for astronomy';
  }
}

/**
 * Calculate average cloud cover from forecast items
 * @param forecastItems Array of forecast items with cloud_cover property
 * @returns Average cloud cover or null if no valid data
 */
export function calculateAverageCloudCover(forecastItems: any[]): number | null {
  if (!Array.isArray(forecastItems) || forecastItems.length === 0) {
    return null;
  }
  
  let totalCloudCover = 0;
  let validItemCount = 0;
  
  forecastItems.forEach(item => {
    const cloudCover = item.cloud_cover || item.cloudcover || item.cloudCover;
    if (typeof cloudCover === 'number' && !isNaN(cloudCover)) {
      totalCloudCover += cloudCover;
      validItemCount++;
    }
  });
  
  if (validItemCount === 0) {
    return null;
  }
  
  return totalCloudCover / validItemCount;
}
