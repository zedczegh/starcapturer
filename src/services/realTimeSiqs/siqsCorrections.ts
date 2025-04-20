
/**
 * SIQS Corrections
 * 
 * This module contains functions that correct any physical impossibilities
 * or inconsistencies in SIQS calculations.
 */

import { SiqsResult, WeatherDataWithClearSky } from './siqsTypes';

/**
 * Correct any physical impossibilities in the SIQS calculation
 */
export function correctPhysicalImpossibilities(
  siqs: SiqsResult,
  weatherData: WeatherDataWithClearSky
): SiqsResult {
  // Make a copy to avoid mutating the original
  const correctedSiqs = { ...siqs };
  
  // Check for impossible cloud cover situations
  if (siqs.factors && siqs.factors.length > 0) {
    // Find cloud cover factor for correction
    const cloudFactor = siqs.factors.find(f => 
      f.name === "Cloud Cover" || 
      f.name === "Nighttime Cloud Cover" || 
      f.name === "云层覆盖" || 
      f.name === "夜间云层覆盖"
    );
    
    if (cloudFactor) {
      // If we have nighttime cloud data and it conflicts with the current factor, correct it
      if (weatherData.nighttimeCloudData && weatherData.nighttimeCloudData.average !== undefined) {
        const nighttimeCloudCover = weatherData.nighttimeCloudData.average;
        
        // If nighttime cloud cover is excellent (below 15%) but SIQS is low, correct it
        if (nighttimeCloudCover <= 15 && siqs.siqs < 6) {
          // Calculate improved score based primarily on nighttime cloud cover
          // Using exponential decay: 0% = 9.5, 10% = 8.5, 20% = 7.0, 30% = 5.5, etc.
          const baseScore = 9.5 * Math.exp(-0.02 * nighttimeCloudCover);
          const cappedScore = Math.min(9.5, Math.max(3.0, baseScore));
          
          // Cap the correction to prevent extreme changes
          const correctedScore = Math.max(siqs.siqs, cappedScore);
          
          console.log(`Correcting SIQS for excellent nighttime conditions: ${siqs.siqs} -> ${correctedScore}`);
          correctedSiqs.siqs = correctedScore;
          
          // Update the factor description to reflect the nighttime value
          cloudFactor.name = "Nighttime Cloud Cover";
          cloudFactor.score = Math.min(10, (100 - nighttimeCloudCover) / 10);
          cloudFactor.description = `Nighttime cloud cover of ${nighttimeCloudCover.toFixed(1)}%, excellent for imaging`;
        }
        // If nighttime cloud cover is terrible but SIQS is high, correct it downward
        else if (nighttimeCloudCover >= 60 && siqs.siqs > 5) {
          const correctedScore = Math.min(siqs.siqs, 5.0);
          console.log(`Correcting SIQS for poor nighttime conditions: ${siqs.siqs} -> ${correctedScore}`);
          correctedSiqs.siqs = correctedScore;
        }
      }
    }
  }
  
  // Check for overly negative results
  if (correctedSiqs.siqs < 0) {
    correctedSiqs.siqs = 0;
  }
  
  return correctedSiqs;
}

/**
 * Ensure temporal consistency in SIQS calculations
 * This prevents wild fluctuations over short periods
 */
export function ensureTemporalConsistency(
  siqs: SiqsResult,
  latitude: number,
  longitude: number
): SiqsResult {
  // Implementation for temporal consistency
  // This would compare with recent calculations for the same location
  
  // For now, we just return the input SIQS as this is a placeholder
  // In a full implementation, we would store recent values and smooth transitions
  
  return siqs;
}

/**
 * Apply nighttime cloud prioritization for more accurate SIQS scores
 * This function ensures nighttime cloud cover is properly weighted
 */
export function prioritizeNighttimeCloudCover(
  siqs: SiqsResult,
  weatherData: WeatherDataWithClearSky
): SiqsResult {
  if (!siqs || !weatherData || !weatherData.nighttimeCloudData) {
    return siqs;
  }
  
  const nighttimeCloudCover = weatherData.nighttimeCloudData.average;
  
  // Only proceed if we have valid nighttime cloud data
  if (typeof nighttimeCloudCover !== 'number') {
    return siqs;
  }
  
  // Create a copy to avoid mutating the original
  const adjustedSiqs = { ...siqs };
  
  // Find cloud cover factor to adjust its weight
  if (siqs.factors && siqs.factors.length > 0) {
    const cloudFactorIndex = siqs.factors.findIndex(f => 
      f.name === "Cloud Cover" || 
      f.name === "Nighttime Cloud Cover" || 
      f.name === "云层覆盖" || 
      f.name === "夜间云层覆盖"
    );
    
    if (cloudFactorIndex >= 0) {
      // Create a new nighttime-specific factor with higher weight
      const originalFactor = siqs.factors[cloudFactorIndex];
      const nighttimeFactor = {
        name: "Nighttime Cloud Cover",
        score: Math.min(10, (100 - nighttimeCloudCover) / 10),
        description: `Astronomical night cloud cover: ${nighttimeCloudCover.toFixed(1)}%`
      };
      
      // Replace the existing cloud factor
      adjustedSiqs.factors = [...siqs.factors];
      adjustedSiqs.factors[cloudFactorIndex] = nighttimeFactor;
      
      // Recalculate the overall SIQS score with higher weight for nighttime clouds
      // This is a simplified recalculation - in a full implementation we would use all factors
      const cloudCoverWeight = 0.35; // Increased weight for nighttime cloud cover
      const otherFactorsWeight = 0.65; // All other factors
      
      // Get average score of other factors
      const otherFactorsAvg = siqs.factors
        .filter((_, i) => i !== cloudFactorIndex)
        .reduce((sum, f) => sum + f.score, 0) / 
        (siqs.factors.length - 1);
      
      // Calculate new weighted score
      const weightedScore = (nighttimeFactor.score * cloudCoverWeight) + 
                           (otherFactorsAvg * otherFactorsWeight);
      
      // Ensure the score is within bounds
      adjustedSiqs.siqs = Math.max(0, Math.min(10, weightedScore));
    }
  }
  
  return adjustedSiqs;
}
