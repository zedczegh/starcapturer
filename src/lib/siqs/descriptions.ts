
import { normalizeScore } from "./factors";

/**
 * Get description for cloud cover factor
 * @param cloudCover Cloud cover percentage (0-100)
 * @param t Translation function
 * @returns Description string with formatted cloud cover percentage
 */
export function getCloudDescription(cloudCover: number, t: any) {
  // Ensure the cloud cover value is within valid range and format to 1 decimal place
  const formattedCloudCover = Math.max(0, Math.min(100, cloudCover)).toFixed(1);
  
  if (cloudCover === 0) {
    return t ? 
      t("Clear skies with 0% cloud cover, perfect for imaging", 
        "晴朗的天空，0%的云层覆盖，非常适合成像") : 
      "Clear skies with 0% cloud cover, perfect for imaging";
  } else if (cloudCover < 10) {
    return t ? 
      t(`Mostly clear with ${formattedCloudCover}% cloud cover, very good for imaging`, 
        `大部分晴朗，${formattedCloudCover}%的云层覆盖，非常适合成像`) : 
      `Mostly clear with ${formattedCloudCover}% cloud cover, very good for imaging`;
  } else if (cloudCover < 30) {
    return t ? 
      t(`Partly cloudy with ${formattedCloudCover}% cloud cover, may affect quality`, 
        `部分多云，${formattedCloudCover}%的云层覆盖，可能影响质量`) : 
      `Partly cloudy with ${formattedCloudCover}% cloud cover, may affect quality`;
  } else if (cloudCover < 50) {
    return t ? 
      t(`Considerable cloud cover (${formattedCloudCover}%), will impact imaging`, 
        `相当多的云层覆盖（${formattedCloudCover}%），将影响成像`) : 
      `Considerable cloud cover (${formattedCloudCover}%), will impact imaging`;
  } else {
    return t ? 
      t(`Heavy cloud cover (${formattedCloudCover}%), imaging not recommended`, 
        `大量云层覆盖（${formattedCloudCover}%），不建议成像`) : 
      `Heavy cloud cover (${formattedCloudCover}%), imaging not recommended`;
  }
}

// Any other description functions can be added here
