
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
