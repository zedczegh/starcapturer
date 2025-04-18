/**
 * Utility functions for creating enhanced descriptions for SIQS factors
 */

/**
 * Create an enhanced description for cloud cover that includes nighttime data
 * @param currentCloudCover Current cloud cover percentage
 * @param nighttimeAverage Average nighttime cloud cover
 * @returns Enhanced description text
 */
export function getEnhancedCloudDescription(
  currentCloudCover: number, 
  nighttimeAverage?: number, 
  detail?: { evening: number, morning: number }
): string {
  // If no nighttime data, return basic description
  if (nighttimeAverage === undefined) {
    return getBasicCloudDescription(currentCloudCover);
  }
  
  // If nighttime average differs significantly from current, provide both
  const difference = Math.abs(currentCloudCover - nighttimeAverage);
  
  if (difference > 15) {
    if (detail) {
      return `Current cloud cover is ${currentCloudCover}%. Nighttime forecast shows an average of ${nighttimeAverage.toFixed(1)}% (Evening: ${detail.evening.toFixed(1)}%, Morning: ${detail.morning.toFixed(1)}%)`;
    }
    return `Current cloud cover is ${currentCloudCover}%. Nighttime forecast shows an average of ${nighttimeAverage.toFixed(1)}%`;
  }
  
  return getBasicCloudDescription(nighttimeAverage);
}

/**
 * Get basic cloud cover description
 * @param cloudCover Cloud cover percentage
 * @returns Description text
 */
function getBasicCloudDescription(cloudCover: number): string {
  if (cloudCover === 0) return "Perfect clear skies (0% cloud cover), ideal for astrophotography";
  if (cloudCover < 10) return `Mostly clear skies (${cloudCover}% cloud cover), excellent for imaging`;
  if (cloudCover < 30) return `Good conditions with ${cloudCover}% cloud cover, suitable for imaging`;
  if (cloudCover < 50) return `Moderate cloud cover (${cloudCover}%), some limitations may apply`;
  if (cloudCover < 70) return `Significant cloud cover (${cloudCover}%), challenging for imaging`;
  return `Heavy cloud cover (${cloudCover}%), not recommended for imaging`;
}

/**
 * Get cloud description in Chinese
 * @param cloudCover Cloud cover percentage
 * @returns Chinese description text
 */
export function getChineseCloudDescription(
  cloudCover: number,
  nighttimeAverage?: number,
  detail?: { evening: number, morning: number }
): string {
  // If no nighttime data, return basic description
  if (nighttimeAverage === undefined) {
    return getBasicChineseCloudDescription(cloudCover);
  }
  
  // If nighttime average differs significantly from current, provide both
  const difference = Math.abs(cloudCover - nighttimeAverage);
  
  if (difference > 15) {
    if (detail) {
      return `当前云层覆盖率为${cloudCover}%。今夜云量显示平均为${nighttimeAverage.toFixed(1)}%（晚上：${detail.evening.toFixed(1)}%，早晨：${detail.morning.toFixed(1)}%）`;
    }
    return `当前云层覆盖率为${cloudCover}%。今夜云量显示平均为${nighttimeAverage.toFixed(1)}%`;
  }
  
  return getBasicChineseCloudDescription(nighttimeAverage);
}

/**
 * Get basic cloud cover description in Chinese
 * @param cloudCover Cloud cover percentage
 * @returns Chinese description text
 */
function getBasicChineseCloudDescription(cloudCover: number): string {
  if (cloudCover === 0) return "完美晴空（0%云量），天文摄影的理想条件";
  if (cloudCover < 10) return `天空大部分晴朗（${cloudCover}%云量），成像效果极佳`;
  if (cloudCover < 30) return `良好条件，${cloudCover}%云量，适合成像`;
  if (cloudCover < 50) return `中等云层覆盖（${cloudCover}%），可能有一些限制`;
  if (cloudCover < 70) return `显著云层覆盖（${cloudCover}%），成像具有挑战性`;
  return `重度云层覆盖（${cloudCover}%），不建议进行成像`;
}
