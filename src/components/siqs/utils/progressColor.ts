
/**
 * Utility functions for determining color based on SIQS score
 */

// Get the appropriate color class for progress bars based on score (0-10 scale)
export const getProgressColorClass = (score: number): string => {
  // Ensure score is on 0-10 scale
  const normalizedScore = score > 10 ? score / 10 : score;
  
  if (normalizedScore >= 8) return 'bg-green-500';
  if (normalizedScore >= 6) return 'bg-blue-500';
  if (normalizedScore >= 4) return 'bg-yellow-500';
  if (normalizedScore >= 2) return 'bg-orange-500';
  return 'bg-red-500';
};

// Get the appropriate text color class based on score (0-10 scale)
export const getProgressTextColorClass = (score: number): string => {
  // Ensure score is on 0-10 scale
  const normalizedScore = score > 10 ? score / 10 : score;
  
  if (normalizedScore >= 8) return 'text-green-500';
  if (normalizedScore >= 6) return 'text-blue-500';
  if (normalizedScore >= 4) return 'text-yellow-500';
  if (normalizedScore >= 2) return 'text-orange-500';
  return 'text-red-500';
};

// Get a hex color value (for direct CSS styles) based on score (0-10 scale)
export const getProgressColor = (score: number): string => {
  // Ensure score is on 0-10 scale
  const normalizedScore = score > 10 ? score / 10 : score;
  
  if (normalizedScore >= 8) return '#22c55e'; // green-500
  if (normalizedScore >= 6) return '#3b82f6'; // blue-500
  if (normalizedScore >= 4) return '#eab308'; // yellow-500
  if (normalizedScore >= 2) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
};

// Get a CSS gradient based on score (0-10 scale)
export const getProgressGradient = (score: number): string => {
  // Ensure score is on 0-10 scale
  const normalizedScore = score > 10 ? score / 10 : score;
  
  if (normalizedScore >= 8) return 'linear-gradient(90deg, rgba(34,197,94,1) 0%, rgba(34,197,94,0.8) 100%)';
  if (normalizedScore >= 6) return 'linear-gradient(90deg, rgba(59,130,246,1) 0%, rgba(59,130,246,0.8) 100%)';
  if (normalizedScore >= 4) return 'linear-gradient(90deg, rgba(234,179,8,1) 0%, rgba(234,179,8,0.8) 100%)';
  if (normalizedScore >= 2) return 'linear-gradient(90deg, rgba(249,115,22,1) 0%, rgba(249,115,22,0.8) 100%)';
  return 'linear-gradient(90deg, rgba(239,68,68,1) 0%, rgba(239,68,68,0.8) 100%)';
};
