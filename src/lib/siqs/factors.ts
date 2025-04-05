
/**
 * Enhanced factor score calculation functions for SIQS with improved algorithms
 * Refactored into modular components for better maintenance
 */

// Import all factor scoring functions from their respective modules
import { calculateCloudScore } from './factorScores/cloudScore';
import { calculateLightPollutionScore, calculateAQIScore } from './factorScores/pollutionScore';
import { calculateSeeingScore, calculateWindScore, calculateHumidityScore } from './factorScores/atmosphericScores';
import { calculateMoonScore, calculateClearSkyScore } from './factorScores/moonAndSkyScores';
import { calculateTerrainFactor } from './factorScores/terrainScore';
import { normalizeScore } from './factorScores/utils';

// Export all functions for use by other modules
export {
  calculateCloudScore,
  calculateLightPollutionScore,
  calculateSeeingScore,
  calculateWindScore,
  calculateHumidityScore,
  calculateMoonScore,
  calculateAQIScore,
  calculateClearSkyScore,
  calculateTerrainFactor,
  normalizeScore
};
