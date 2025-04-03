
/**
 * Get cloud cover description with specific nighttime information
 * @param cloudCover Cloud cover percentage
 * @param nighttimeAvg Optional nighttime average cloud cover
 */
export function getEnhancedCloudDescription(cloudCover: number, nighttimeAvg?: number): string {
  // Format cloud cover to one decimal place
  const formattedCloudCover = cloudCover.toFixed(1);
  
  // Base description
  let description = "";
  
  if (cloudCover <= 10) {
    description = `Clear skies with ${formattedCloudCover}% cloud cover, excellent for imaging`;
  } else if (cloudCover <= 25) {
    description = `Mostly clear with ${formattedCloudCover}% cloud cover, good for imaging`;
  } else if (cloudCover <= 40) {
    description = `Partly cloudy with ${formattedCloudCover}% cloud cover, may affect quality`;
  } else if (cloudCover <= 50) {
    description = `Cloudy with ${formattedCloudCover}% cloud cover, challenging conditions`;
  } else {
    description = `Heavy cloud cover (${formattedCloudCover}%) makes imaging difficult`;
  }
  
  // Add nighttime information if available
  if (nighttimeAvg !== undefined) {
    const nighttimeFormatted = nighttimeAvg.toFixed(1);
    
    if (Math.abs(cloudCover - nighttimeAvg) > 10) {
      description += ` (nighttime average: ${nighttimeFormatted}%)`;
    }
  }
  
  return description;
}

/**
 * Get cloud description in the appropriate language
 * @param cloudCover Cloud cover percentage
 * @param language Language code (en or zh)
 * @param nighttimeAvg Optional nighttime average cloud cover
 */
export function getLocalizedCloudDescription(cloudCover: number, language: 'en' | 'zh', nighttimeAvg?: number): string {
  // Format cloud cover to one decimal place
  const formattedCloudCover = cloudCover.toFixed(1);
  
  // Base description
  let description = "";
  
  if (language === 'en') {
    if (cloudCover <= 10) {
      description = `Clear skies with ${formattedCloudCover}% cloud cover, excellent for imaging`;
    } else if (cloudCover <= 25) {
      description = `Mostly clear with ${formattedCloudCover}% cloud cover, good for imaging`;
    } else if (cloudCover <= 40) {
      description = `Partly cloudy with ${formattedCloudCover}% cloud cover, may affect quality`;
    } else if (cloudCover <= 50) {
      description = `Cloudy with ${formattedCloudCover}% cloud cover, challenging conditions`;
    } else {
      description = `Heavy cloud cover (${formattedCloudCover}%) makes imaging difficult`;
    }
    
    // Add nighttime information if available
    if (nighttimeAvg !== undefined) {
      const nighttimeFormatted = nighttimeAvg.toFixed(1);
      
      if (Math.abs(cloudCover - nighttimeAvg) > 10) {
        description += ` (nighttime average: ${nighttimeFormatted}%)`;
      }
    }
  } else {
    // Chinese descriptions
    if (cloudCover <= 10) {
      description = `晴朗天空，云量为${formattedCloudCover}%，非常适合成像`;
    } else if (cloudCover <= 25) {
      description = `大部分晴朗，云量为${formattedCloudCover}%，适合成像`;
    } else if (cloudCover <= 40) {
      description = `部分多云，云量为${formattedCloudCover}%，可能影响成像质量`;
    } else if (cloudCover <= 50) {
      description = `多云，云量为${formattedCloudCover}%，观测条件具有挑战性`;
    } else {
      description = `重度云层覆盖(${formattedCloudCover}%)使成像困难`;
    }
    
    // Add nighttime information if available
    if (nighttimeAvg !== undefined) {
      const nighttimeFormatted = nighttimeAvg.toFixed(1);
      
      if (Math.abs(cloudCover - nighttimeAvg) > 10) {
        description += ` (夜间平均: ${nighttimeFormatted}%)`;
      }
    }
  }
  
  return description;
}
