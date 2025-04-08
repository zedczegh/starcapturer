
// Helper utilities for SIQS calculations
import { SIQSFactors, SIQSResult } from "@/lib/siqs/types";
import { calculateNighttimeSiqs, isNighttimeSiqsCalculation } from "@/utils/nighttimeSIQS";

/**
 * Process SIQS factors focusing on nighttime data when available
 */
export function processSiqsFactors(factors: SIQSFactors): SIQSResult {
  // Use nighttime calculation when nighttime data is available
  if (isNighttimeSiqsCalculation(factors)) {
    return calculateNighttimeSiqs(factors);
  }
  
  // Fall back to standard calculation
  return calculateStandardSiqs(factors);
}

/**
 * Standard SIQS calculation for daytime conditions
 */
export function calculateStandardSiqs(factors: SIQSFactors): SIQSResult {
  // Define weights
  const cloudWeight = 0.3;
  const bortleWeight = 0.3;
  const windWeight = 0.2;
  const humidityWeight = 0.2;
  
  // Calculate scores (0-10 scale)
  const cloudScore = 10 - (factors.cloudCover / 10);
  const bortleScore = 10 - factors.bortleScale;
  const windScore = Math.max(0, 10 - (factors.windSpeed / 2));
  const humidityScore = 10 - (factors.humidity / 10);
  
  // Calculate weighted score
  const weightedScore = (
    cloudWeight * cloudScore +
    bortleWeight * bortleScore +
    windWeight * windScore +
    humidityWeight * humidityScore
  );
  
  // Format score and determine viability
  const formattedScore = parseFloat(weightedScore.toFixed(1));
  const isViable = formattedScore >= 5;
  
  return {
    score: formattedScore,
    isViable,
    factors: [
      {
        name: 'Cloud Cover',
        score: cloudScore,
        description: `${Math.round(factors.cloudCover)}% cloud coverage`
      },
      {
        name: 'Light Pollution',
        score: bortleScore,
        description: `Bortle ${factors.bortleScale} sky`
      },
      {
        name: 'Wind',
        score: windScore,
        description: `${Math.round(factors.windSpeed)} km/h wind speed`
      },
      {
        name: 'Humidity',
        score: humidityScore,
        description: `${Math.round(factors.humidity)}% humidity`
      }
    ]
  };
}
