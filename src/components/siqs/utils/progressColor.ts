
/**
 * Get color class for progress bar based on score
 * @param score SIQS score (0-10)
 * @returns CSS class for the progress bar
 */
export function getProgressColorClass(score: number): string {
  if (score >= 8) return "bg-green-500/80";
  if (score >= 6) return "bg-blue-500/80";
  if (score >= 5) return "bg-olive-500/80"; // Olive for scores over 5
  if (score >= 4) return "bg-yellow-500/80";
  if (score >= 2) return "bg-orange-500/80";
  return "bg-red-500/80";
}

/**
 * Get text color class for progress bar based on score
 * @param score SIQS score (0-10)
 * @returns CSS class for the text
 */
export function getProgressTextColorClass(score: number): string {
  if (score >= 8) return "text-green-500";
  if (score >= 6) return "text-blue-500";
  if (score >= 5) return "text-olive-500"; // Olive for scores over 5
  if (score >= 4) return "text-yellow-500";
  if (score >= 2) return "text-orange-500";
  return "text-red-500";
}

/**
 * Get hex color for progress based on score
 * @param score SIQS score (0-10)
 * @returns Hex color code
 */
export function getProgressColor(score: number): string {
  if (score >= 8) return "#22C55E"; // green-500
  if (score >= 6) return "#3B82F6"; // blue-500
  if (score >= 5) return "#84CC16"; // lime-500
  if (score >= 4) return "#EAB308"; // yellow-500
  if (score >= 2) return "#F97316"; // orange-500
  return "#EF4444"; // red-500
}
