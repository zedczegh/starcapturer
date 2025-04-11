
/**
 * Get CSS color class based on score
 * @param score Score value (0-10)
 * @returns CSS class for text color
 */
export const getScoreColorClass = (score: number): string => {
  if (isNaN(score) || score === null || score === undefined) {
    return 'text-red-500';
  }
  
  // Normalize score to 0-10 range
  const normalizedScore = Math.max(0, Math.min(10, score));
  
  if (normalizedScore >= 8.5) return 'text-green-600';
  if (normalizedScore >= 7.5) return 'text-green-500';
  if (normalizedScore >= 6.5) return 'text-green-400';
  if (normalizedScore >= 5.5) return 'text-amber-500';
  if (normalizedScore >= 4.5) return 'text-amber-500';
  if (normalizedScore >= 3.5) return 'text-orange-500';
  if (normalizedScore >= 2.5) return 'text-orange-600';
  if (normalizedScore >= 1.5) return 'text-red-400';
  return 'text-red-500';
}

/**
 * Format SIQS score for display
 * @param score SIQS score
 * @returns Formatted string with one decimal place
 */
export const formatSIQSScore = (score: number | undefined | null): string => {
  if (score === undefined || score === null || isNaN(score)) {
    return '0.0';
  }
  return score.toFixed(1);
}

/**
 * Get quality level text based on score
 * @param score SIQS score (0-10)
 * @param t Optional translation function
 * @returns Quality level text
 */
export const getQualityLevelText = (score: number, t?: any): string => {
  if (score >= 8.5) return t ? t("Outstanding", "极佳") : "Outstanding";
  if (score >= 7.5) return t ? t("Excellent", "优秀") : "Excellent";
  if (score >= 6.5) return t ? t("Very Good", "很好") : "Very Good";
  if (score >= 5.5) return t ? t("Good", "良好") : "Good";
  if (score >= 4.5) return t ? t("Fair", "一般") : "Fair";
  if (score >= 3.5) return t ? t("Mediocre", "中等") : "Mediocre";
  if (score >= 2.5) return t ? t("Poor", "较差") : "Poor";
  if (score >= 1.5) return t ? t("Very Poor", "很差") : "Very Poor";
  return t ? t("Terrible", "糟糕") : "Terrible";
}
