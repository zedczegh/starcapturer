
/**
 * Utility functions for progress bars
 */

/**
 * Get the appropriate color class for a progress bar based on value
 */
export function getProgressColorClass(value: number): string {
  if (value >= 80) return "bg-green-500";
  if (value >= 60) return "bg-lime-500";
  if (value >= 40) return "bg-yellow-500";
  if (value >= 20) return "bg-orange-500";
  return "bg-red-500";
}

/**
 * Get SIQS progress bar color class
 */
export function getSiqsProgressColor(score: number): string {
  if (score >= 8) return "bg-primary";
  if (score >= 6) return "bg-blue-500";
  if (score >= 4) return "bg-green-500";
  if (score >= 2) return "bg-yellow-500";
  return "bg-red-500";
}

/**
 * Format SIQS score consistently
 */
export function formatSIQSScore(score: number | null): string {
  if (score === null || score === undefined) return "--";
  return score.toFixed(1);
}
