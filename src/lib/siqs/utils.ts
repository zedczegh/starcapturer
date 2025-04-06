
/**
 * Format SIQS score with consistent decimal places
 * @param score SIQS score
 * @returns Formatted score string with one decimal place
 */
export function formatSIQSScore(score: number): string {
  if (typeof score !== 'number' || isNaN(score)) {
    return "0.0";
  }
  
  // Format with one decimal place
  return score.toFixed(1);
}

/**
 * Get SIQS level description based on score
 * @param score SIQS score (0-10)
 * @returns Quality level description
 */
export function getSIQSLevel(score: number): string {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  if (score >= 4) return "Average";
  if (score >= 2) return "Poor";
  return "Bad";
}

/**
 * Normalize SIQS score to ensure it's on the correct scale
 * @param score Raw SIQS score
 * @returns Normalized score on 0-10 scale
 */
export function normalizeSIQSScore(score: number): number {
  if (typeof score !== 'number' || isNaN(score)) {
    return 0;
  }
  
  // If already on 0-10 scale, just clamp to that range
  if (score >= 0 && score <= 10) {
    return Math.max(0, Math.min(10, score));
  }
  
  // If on 0-100 scale, convert to 0-10
  if (score > 10) {
    return Math.round((score / 10) * 10) / 10;
  }
  
  return Math.max(0, score);
}

/**
 * Get SIQS descriptor text
 * @param score SIQS score
 * @param language Language code ('en' or 'zh')
 * @returns Descriptive text
 */
export function getSIQSDescription(score: number, language: string = 'en'): string {
  if (language === 'zh') {
    if (score >= 8.5) return "理想的天文摄影条件";
    if (score >= 7.5) return "极好的星空质量";
    if (score >= 6.5) return "非常适合天文摄影";
    if (score >= 5.5) return "良好的观测和拍摄条件";
    if (score >= 4.5) return "可以进行基础天文观测";
    if (score >= 3.5) return "观测条件一般";
    if (score >= 2.5) return "观测条件较差";
    if (score >= 1.5) return "观测条件差";
    return "不适合天文观测";
  } else {
    if (score >= 8.5) return "Ideal conditions for astrophotography";
    if (score >= 7.5) return "Excellent sky quality";
    if (score >= 6.5) return "Very good for astrophotography";
    if (score >= 5.5) return "Good observing and imaging conditions";
    if (score >= 4.5) return "Suitable for basic observations";
    if (score >= 3.5) return "Average observing conditions";
    if (score >= 2.5) return "Below average conditions";
    if (score >= 1.5) return "Poor conditions";
    return "Not suitable for astronomical observation";
  }
}
