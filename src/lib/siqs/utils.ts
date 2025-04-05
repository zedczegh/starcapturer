
/**
 * Utility functions for SIQS (Stellar Imaging Quality Score) calculations
 */

// Convert SIQS score to a color for visual representation
export function siqsToColor(score: number): string {
  if (score >= 9) return "#22c55e"; // Green - Excellent
  if (score >= 7) return "#84cc16"; // Lime green - Very Good
  if (score >= 5) return "#3b82f6"; // Blue - Good
  if (score >= 4) return "#eab308"; // Yellow - Fair
  if (score >= 3) return "#f59e0b"; // Amber - Moderate
  if (score >= 2) return "#f97316"; // Orange - Poor
  return "#ef4444"; // Red - Bad
}

// Map SIQS score to a text description
export function siqsToText(score: number, language: string = 'en'): string {
  if (language === 'zh') {
    if (score >= 9) return "极佳";
    if (score >= 7) return "非常好";
    if (score >= 5) return "良好";
    if (score >= 4) return "一般";
    if (score >= 3) return "中等";
    if (score >= 2) return "较差";
    return "差";
  } else {
    if (score >= 9) return "Excellent";
    if (score >= 7) return "Very Good";
    if (score >= 5) return "Good";
    if (score >= 4) return "Fair";
    if (score >= 3) return "Moderate";
    if (score >= 2) return "Poor";
    return "Bad";
  }
}

// Check if imaging is impossible based on cloud cover
export function isImagingImpossible(cloudCover: number): boolean {
  return typeof cloudCover === 'number' && cloudCover > 50;
}

// Validate cloud cover input to ensure it's within valid range
export function validateCloudCover(cloudCover: any): number {
  if (typeof cloudCover !== 'number' || isNaN(cloudCover)) {
    return 0;
  }
  return Math.max(0, Math.min(100, cloudCover));
}

/**
 * Normalize factor scores to a 0-10 scale for consistent display
 */
export function normalizeFactorScores(factors: Array<any> = []): Array<any> {
  if (!factors || factors.length === 0) return [];

  return factors.map(factor => {
    if (factor.score >= 0 && factor.score <= 10) {
      // Already normalized
      return factor;
    } else if (factor.score >= 0 && factor.score <= 100) {
      // Convert from 0-100 to 0-10
      return {
        ...factor,
        score: factor.score / 10
      };
    } else {
      // Default normalization for unknown scales
      const normalizedScore = Math.max(0, Math.min(10, factor.score));
      return {
        ...factor,
        score: normalizedScore
      };
    }
  });
}

/**
 * Get a weight for a factor based on its name
 */
export function getFactorWeight(factorName: string): number {
  const lowerName = factorName.toLowerCase();
  
  if (lowerName.includes('cloud')) return 0.30;
  if (lowerName.includes('pollution') || lowerName.includes('bortle')) return 0.20;
  if (lowerName.includes('seeing')) return 0.15;
  if (lowerName.includes('wind')) return 0.10;
  if (lowerName.includes('humid')) return 0.10;
  if (lowerName.includes('aqi') || lowerName.includes('air quality')) return 0.10;
  if (lowerName.includes('moon')) return 0.05;
  
  // Default weight
  return 0.10;
}
