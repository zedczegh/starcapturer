
/**
 * Utilities for SIQS calculation, formatting, and display
 */

/**
 * Format SIQS score for display with appropriate precision
 */
export function formatSIQSScoreForDisplay(score: number | undefined | null): string {
  if (score === undefined || score === null) return "--";
  return score.toFixed(1);
}

/**
 * Get color class for SIQS score
 */
export function getSIQSColorClass(score: number | undefined | null): string {
  if (score === undefined || score === null) return "text-muted-foreground";
  
  if (score >= 8) return "text-emerald-400";
  if (score >= 6) return "text-green-400";
  if (score >= 4) return "text-yellow-400";
  if (score >= 2) return "text-orange-400";
  return "text-red-400";
}

/**
 * Get description for SIQS score
 */
export function getSIQSDescription(score: number | undefined | null, language: string = 'en'): string {
  if (score === undefined || score === null) return language === 'en' ? "Unknown" : "未知";
  
  if (language === 'en') {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Very Good";
    if (score >= 4) return "Good";
    if (score >= 2) return "Fair";
    return "Poor";
  } else {
    if (score >= 8) return "极佳";
    if (score >= 6) return "很好";
    if (score >= 4) return "良好";
    if (score >= 2) return "一般";
    return "较差";
  }
}

/**
 * Get SIQS progress bar color class
 */
export function getSIQSProgressColor(score: number | undefined | null): string {
  if (score === undefined || score === null) return "bg-muted";
  
  if (score >= 8) return "bg-emerald-500";
  if (score >= 6) return "bg-green-500";
  if (score >= 4) return "bg-yellow-500";
  if (score >= 2) return "bg-orange-500";
  return "bg-red-500";
}

/**
 * Get SIQS background gradient class
 */
export function getSIQSBackgroundClass(score: number | undefined | null): string {
  if (score === undefined || score === null) return "bg-cosmic-900/50";
  
  if (score >= 8) return "bg-gradient-to-r from-emerald-900/30 to-cosmic-900/50 border-emerald-800/30";
  if (score >= 6) return "bg-gradient-to-r from-green-900/30 to-cosmic-900/50 border-green-800/30";
  if (score >= 4) return "bg-gradient-to-r from-yellow-900/30 to-cosmic-900/50 border-yellow-800/30";
  if (score >= 2) return "bg-gradient-to-r from-orange-900/30 to-cosmic-900/50 border-orange-800/30";
  return "bg-gradient-to-r from-red-900/30 to-cosmic-900/50 border-red-800/30";
}
