
import { ForecastDayAstroData } from '@/services/forecast/forecastAstroService';

/**
 * Get a color based on SIQS score
 * 
 * @param siqs SIQS score (0-10)
 * @returns CSS color string
 */
export const getSiqsColorClass = (siqs: number | null): string => {
  if (siqs === null) return "bg-gray-500";
  
  if (siqs >= 8) return "bg-green-500";
  if (siqs >= 6.5) return "bg-green-400";
  if (siqs >= 5) return "bg-yellow-400";
  if (siqs >= 3.5) return "bg-orange-400";
  return "bg-red-500";
};

/**
 * Format SIQS score for display
 * 
 * @param siqs SIQS score
 * @returns Formatted string
 */
export const formatSiqs = (siqs: number | null): string => {
  if (siqs === null) return "N/A";
  return siqs.toFixed(1);
};

/**
 * Get quality text based on SIQS score
 * 
 * @param siqs SIQS score
 * @returns Quality description
 */
export const getSiqsQuality = (siqs: number | null): string => {
  if (siqs === null) return "Unknown";
  
  if (siqs >= 8) return "Excellent";
  if (siqs >= 6.5) return "Very Good";
  if (siqs >= 5) return "Good";
  if (siqs >= 3.5) return "Fair";
  if (siqs >= 2) return "Poor";
  return "Very Poor";
};

/**
 * Get a simple emoji indicator for SIQS quality
 * 
 * @param siqs SIQS score
 * @returns Emoji string
 */
export const getSiqsEmoji = (siqs: number | null): string => {
  if (siqs === null) return "❓";
  
  if (siqs >= 8) return "🌟";
  if (siqs >= 6.5) return "✨";
  if (siqs >= 5) return "👍";
  if (siqs >= 3.5) return "🤔";
  if (siqs >= 2) return "👎";
  return "❌";
};

/**
 * Sort forecast days by SIQS quality
 * 
 * @param days Array of forecast days
 * @returns Sorted array
 */
export const sortByQuality = (days: ForecastDayAstroData[]): ForecastDayAstroData[] => {
  return [...days].sort((a, b) => {
    const siqsA = a.siqs || 0;
    const siqsB = b.siqs || 0;
    return siqsB - siqsA;
  });
};

/**
 * Find the best day for astronomical viewing
 * 
 * @param days Array of forecast days
 * @returns Best day or null
 */
export const findBestDay = (days: ForecastDayAstroData[]): ForecastDayAstroData | null => {
  if (!days.length) return null;
  
  return sortByQuality(days)[0];
};

/**
 * Calculate the average SIQS score for the period
 * 
 * @param days Array of forecast days
 * @returns Average SIQS
 */
export const calculateAverageSiqs = (days: ForecastDayAstroData[]): number | null => {
  const validScores = days
    .map(day => day.siqs)
    .filter((siqs): siqs is number => siqs !== null);
  
  if (!validScores.length) return null;
  
  const sum = validScores.reduce((acc, score) => acc + score, 0);
  return sum / validScores.length;
};
