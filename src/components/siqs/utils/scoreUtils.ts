
import { Language } from "@/contexts/LanguageContext";

// Memoize recommendation messages to avoid recalculations
const recommendationCache: Record<number, Record<string, string>> = {};

/**
 * Get recommendation message based on SIQS score
 * @param score SIQS score (0-10 scale)
 * @param language Current UI language
 * @returns Appropriate recommendation message
 */
export const getRecommendationMessage = (score: number, language: Language): string => {
  // Round to nearest 0.5 for caching purposes
  const roundedScore = Math.round(score * 2) / 2;
  
  // Check cache first
  if (recommendationCache[roundedScore]?.[language]) {
    return recommendationCache[roundedScore][language];
  }
  
  let result = "";
  if (language === 'en') {
    if (score >= 8) result = "Excellent conditions for astrophotography. Optimal imaging possible.";
    else if (score >= 6) result = "Good conditions for imaging. Minor adjustments may be needed.";
    else if (score >= 5) result = "Above average conditions. Good for many imaging targets.";
    else if (score >= 4) result = "Fair conditions. Expect some challenges with image quality.";
    else if (score >= 2) result = "Poor conditions. Consider rescheduling or changing location.";
    else result = "Unsuitable conditions. Not recommended for imaging.";
  } else {
    if (score >= 8) result = "天文摄影的绝佳条件。可以进行最佳成像。";
    else if (score >= 6) result = "成像条件良好。可能需要微小调整。";
    else if (score >= 5) result = "条件较好。适合多种成像目标。";
    else if (score >= 4) result = "条件一般。图像质量可能面临一些挑战。";
    else if (score >= 2) result = "条件较差。建议重新安排或更换地点。";
    else result = "不适合的条件。不推荐进行成像。";
  }
  
  // Cache the result
  if (!recommendationCache[roundedScore]) {
    recommendationCache[roundedScore] = {};
  }
  recommendationCache[roundedScore][language] = result;
  
  return result;
};

// Color class cache
const scoreColorCache: Record<number, string> = {};

/**
 * Get text color class based on score
 * @param score SIQS score (0-10 scale)
 * @returns CSS class for text color
 */
export const getScoreColorClass = (score: number): string => {
  // Round to nearest 0.1 for caching
  const roundedScore = Math.round(score * 10) / 10;
  
  if (scoreColorCache[roundedScore] !== undefined) {
    return scoreColorCache[roundedScore];
  }
  
  let result = "text-red-400";
  if (score >= 8) result = "text-green-400";
  else if (score >= 6) result = "text-green-300";
  else if (score >= 5) result = "text-olive-500";
  else if (score >= 4) result = "text-yellow-300";
  else if (score >= 2) result = "text-orange-300";
  
  scoreColorCache[roundedScore] = result;
  return result;
};

// Background class cache
const scoreBgCache: Record<number, string> = {};

/**
 * Get background color class based on score
 * @param score SIQS score (0-10 scale)
 * @returns CSS class for background color
 */
export const getScoreBackgroundClass = (score: number): string => {
  // Round to nearest 0.1 for caching
  const roundedScore = Math.round(score * 10) / 10;
  
  if (scoreBgCache[roundedScore] !== undefined) {
    return scoreBgCache[roundedScore];
  }
  
  let result = "bg-red-400/20";
  if (score >= 8) result = "bg-green-400/20";
  else if (score >= 6) result = "bg-green-300/20";
  else if (score >= 5) result = "bg-olive-500/20";
  else if (score >= 4) result = "bg-yellow-300/20";
  else if (score >= 2) result = "bg-orange-300/20";
  
  scoreBgCache[roundedScore] = result;
  return result;
};

/**
 * Get score label based on score value
 * @param score SIQS score (0-10 scale)
 * @param language Current UI language
 * @returns Localized label for the score
 */
export const getScoreLabel = (score: number, language: Language): string => {
  if (language === 'en') {
    if (score >= 8) return "Excellent";
    else if (score >= 6) return "Good";
    else if (score >= 5) return "Above Average";
    else if (score >= 4) return "Fair";
    else if (score >= 2) return "Poor";
    else return "Bad";
  } else {
    if (score >= 8) return "极佳";
    else if (score >= 6) return "良好";
    else if (score >= 5) return "较好";
    else if (score >= 4) return "一般";
    else if (score >= 2) return "较差";
    else return "很差";
  }
};

/**
 * Get quality level for a score as an object
 * @param score SIQS score (0-10 scale)
 * @returns Object with level and color information
 */
export const getQualityLevel = (score: number) => {
  if (score >= 8) {
    return { level: 'excellent', color: 'green' };
  } else if (score >= 6) {
    return { level: 'good', color: 'lime' };
  } else if (score >= 5) {
    return { level: 'above-average', color: 'olive' };
  } else if (score >= 4) {
    return { level: 'average', color: 'yellow' };
  } else if (score >= 2) {
    return { level: 'poor', color: 'orange' };
  }
  return { level: 'bad', color: 'red' };
};
