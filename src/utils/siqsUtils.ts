
/**
 * Utilities for SIQS (Sky Information Quality Score) display and calculations
 */

/**
 * Get a descriptive text for a SIQS score based on the current language
 */
export function getScoreDescription(score: number, language: string = 'en'): string {
  const normalizedScore = Math.max(0, Math.min(10, score));
  
  if (language === 'zh') {
    if (normalizedScore <= 2) return '极差';
    if (normalizedScore <= 4) return '较差';
    if (normalizedScore <= 6) return '一般';
    if (normalizedScore <= 8) return '良好';
    return '极佳';
  } else {
    if (normalizedScore <= 2) return 'Very Poor';
    if (normalizedScore <= 4) return 'Poor';
    if (normalizedScore <= 6) return 'Average';
    if (normalizedScore <= 8) return 'Good';
    return 'Excellent';
  }
}

/**
 * Get color class for a SIQS score
 */
export function getScoreColor(score: number): string {
  const normalizedScore = Math.max(0, Math.min(10, score));
  
  if (normalizedScore <= 2) return 'bg-red-500 border-red-600 text-white';
  if (normalizedScore <= 4) return 'bg-orange-400 border-orange-500 text-white';
  if (normalizedScore <= 6) return 'bg-yellow-400 border-yellow-500 text-white';
  if (normalizedScore <= 8) return 'bg-green-500 border-green-600 text-white';
  return 'bg-purple-500 border-purple-600 text-white';
}

/**
 * Format a SIQS score for display
 */
export function formatSIQSScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A';
  
  const normalizedScore = Math.max(0, Math.min(10, score));
  return normalizedScore.toFixed(1);
}

/**
 * Get score grade based on a percentage or decimal score
 */
export function getScoreGrade(score: number): string {
  // Convert to 0-10 scale if given as percentage
  const normalizedScore = score > 10 ? score / 10 : score;
  
  if (normalizedScore <= 2) return 'F';
  if (normalizedScore <= 4) return 'D';
  if (normalizedScore <= 6) return 'C';
  if (normalizedScore <= 8) return 'B';
  return 'A';
}

/**
 * Calculate summary description of SIQS for a location
 */
export function getSIQSSummary(siqsResult: any, language: string = 'en'): string {
  if (!siqsResult || !siqsResult.score) {
    return language === 'en' ? 'No SIQS data available' : '没有可用的SIQS数据';
  }
  
  const score = siqsResult.score;
  const description = getScoreDescription(score, language);
  
  if (language === 'en') {
    return `This location has ${description.toLowerCase()} conditions for astronomy with a score of ${score.toFixed(1)}/10.`;
  } else {
    return `该位置有${description}的天文观测条件，得分为${score.toFixed(1)}/10。`;
  }
}
