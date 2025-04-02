
/**
 * Utility functions for SIQS score calculations and transformations
 */

/**
 * Normalize a set of factor scores to ensure they're all on a 0-10 scale
 */
export const normalizeFactorScores = (factors: Array<{name: string; score: number; description: string}>) => {
  if (!factors || factors.length === 0) return [];
  
  return factors.map(factor => {
    // If score is already in 0-10 range, leave it
    if (factor.score >= 0 && factor.score <= 10) {
      return factor;
    }
    
    // If score is out of range, normalize it to 0-10
    let normalizedScore: number;
    
    // Handle different scales based on factor type
    if (factor.name === "Bortle Scale" || factor.name === "伯特尔等级") {
      // Convert Bortle scale (1-9) to SIQS (0-10)
      normalizedScore = 10 - (factor.score - 1) * (10 / 8);
    } else if (factor.name === "Air Quality Index" || factor.name === "空气质量指数") {
      // Convert AQI (0-500) to SIQS (0-10)
      normalizedScore = 10 - (factor.score / 50);
    } else {
      // General case: assume 0-100 scale
      normalizedScore = factor.score / 10;
    }
    
    // Clamp to 0-10 range
    return {
      ...factor,
      score: Math.max(0, Math.min(10, normalizedScore))
    };
  });
};

/**
 * Convert SIQS score to a color
 */
export const siqsToColor = (score: number): string => {
  if (score >= 8) return "emerald"; // Excellent
  if (score >= 6) return "cyan"; // Very Good
  if (score >= 4) return "blue"; // Good
  if (score >= 3) return "amber"; // Fair
  return "rose"; // Poor
};

/**
 * Get a random score for 100% cloud cover between 1.1 and 1.3
 */
export const getRandomCloudCoverScore = (): number => {
  // Generate random number between 1.1 and 1.3
  return 1.1 + Math.random() * 0.2;
};

/**
 * Convert SIQS to string rating
 */
export const siqsToRating = (score: number, language: string = 'en'): string => {
  const ratings = {
    en: {
      excellent: 'Excellent',
      veryGood: 'Very Good',
      good: 'Good',
      fair: 'Fair',
      poor: 'Poor'
    },
    zh: {
      excellent: '极佳',
      veryGood: '非常好',
      good: '良好',
      fair: '一般',
      poor: '较差'
    }
  };
  
  const lang = language === 'zh' ? 'zh' : 'en';
  
  if (score >= 8) return ratings[lang].excellent;
  if (score >= 6) return ratings[lang].veryGood;
  if (score >= 4) return ratings[lang].good;
  if (score >= 3) return ratings[lang].fair;
  return ratings[lang].poor;
};

/**
 * Convert SIQS score to quality level (1-5)
 */
export const siqsToQualityLevel = (score: number): number => {
  if (score >= 8) return 5; // Excellent
  if (score >= 6) return 4; // Very Good
  if (score >= 4) return 3; // Good
  if (score >= 3) return 2; // Fair
  return 1; // Poor
};
