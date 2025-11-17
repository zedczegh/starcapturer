/**
 * Diagnostic utilities for star detection and Bortle scale calculation
 * Helps verify algorithm accuracy and performance
 */

export interface StarDetectionDiagnostics {
  imageSize: { width: number; height: number };
  backgroundStats: {
    median: number;
    mad: number;
    mean: number;
    threshold: number;
  };
  detectionStats: {
    totalStars: number;
    filteredHotPixels: number;
    avgSignalToNoise: number;
    avgContrast: number;
  };
  bortleCalculation: {
    starCount: number;
    skyBrightness: number;
    starScore: number;
    brightnessScore: number;
    finalBortle: number;
  };
  processingTime: number;
}

/**
 * Validate Bortle scale calculation against known references
 */
export function validateBortleCalculation(
  starCount: number,
  skyBrightness: number,
  calculatedBortle: number
): { isValid: boolean; confidence: 'high' | 'medium' | 'low'; warnings: string[] } {
  const warnings: string[] = [];
  let confidence: 'high' | 'medium' | 'low' = 'high';
  
  // Validate star count is reasonable
  if (starCount < 0 || starCount > 300) {
    warnings.push(`Unusual star count: ${starCount}. Expected range 0-300.`);
    confidence = 'low';
  }
  
  // Validate sky brightness is in valid range
  if (skyBrightness < 0 || skyBrightness > 255) {
    warnings.push(`Invalid sky brightness: ${skyBrightness}. Expected 0-255.`);
    confidence = 'low';
  }
  
  // Check for consistency between star count and sky brightness
  if (starCount > 100 && skyBrightness > 150) {
    warnings.push('Inconsistency: High star count with bright sky. May indicate camera artifacts.');
    confidence = 'medium';
  }
  
  if (starCount < 5 && skyBrightness < 50) {
    warnings.push('Inconsistency: Low star count with dark sky. May indicate detection issues.');
    confidence = 'medium';
  }
  
  // Validate Bortle scale range
  if (calculatedBortle < 1 || calculatedBortle > 9) {
    warnings.push(`Invalid Bortle scale: ${calculatedBortle}. Must be between 1-9.`);
    confidence = 'low';
  }
  
  // Check if Bortle matches expected ranges
  const expectedBortleRange = getExpectedBortleRange(starCount, skyBrightness);
  if (calculatedBortle < expectedBortleRange.min || calculatedBortle > expectedBortleRange.max) {
    warnings.push(
      `Calculated Bortle ${calculatedBortle} is outside expected range ${expectedBortleRange.min}-${expectedBortleRange.max} ` +
      `for ${starCount} stars and brightness ${skyBrightness.toFixed(0)}`
    );
    confidence = confidence === 'high' ? 'medium' : 'low';
  }
  
  const isValid = warnings.length === 0 || confidence !== 'low';
  
  return { isValid, confidence, warnings };
}

/**
 * Get expected Bortle range based on star count and sky brightness
 */
function getExpectedBortleRange(starCount: number, skyBrightness: number): { min: number; max: number } {
  // Create rough expected ranges based on star count
  let minBortle = 1;
  let maxBortle = 9;
  
  if (starCount >= 120) {
    minBortle = 1;
    maxBortle = 2;
  } else if (starCount >= 80) {
    minBortle = 2;
    maxBortle = 3;
  } else if (starCount >= 50) {
    minBortle = 2.5;
    maxBortle = 4;
  } else if (starCount >= 30) {
    minBortle = 3.5;
    maxBortle = 5;
  } else if (starCount >= 15) {
    minBortle = 4.5;
    maxBortle = 6;
  } else if (starCount >= 8) {
    minBortle = 5.5;
    maxBortle = 7;
  } else if (starCount >= 4) {
    minBortle = 6.5;
    maxBortle = 8;
  } else if (starCount >= 1) {
    minBortle = 7.5;
    maxBortle = 9;
  } else {
    minBortle = 8.5;
    maxBortle = 9;
  }
  
  // Adjust based on sky brightness
  const normalizedBrightness = skyBrightness / 255;
  if (normalizedBrightness < 0.2 && minBortle > 1) {
    minBortle = Math.max(1, minBortle - 0.5);
  } else if (normalizedBrightness > 0.8 && maxBortle < 9) {
    maxBortle = Math.min(9, maxBortle + 0.5);
  }
  
  return { min: minBortle, max: maxBortle };
}

/**
 * Generate a diagnostic report for star detection
 */
export function generateDiagnosticReport(diagnostics: StarDetectionDiagnostics): string {
  const lines = [
    '=== Star Detection Diagnostic Report ===',
    '',
    `Image Size: ${diagnostics.imageSize.width}x${diagnostics.imageSize.height}`,
    `Processing Time: ${diagnostics.processingTime.toFixed(2)}ms`,
    '',
    '--- Background Statistics ---',
    `Median Luminance: ${diagnostics.backgroundStats.median.toFixed(2)}`,
    `MAD (noise): ${diagnostics.backgroundStats.mad.toFixed(2)}`,
    `Mean Luminance: ${diagnostics.backgroundStats.mean.toFixed(2)}`,
    `Detection Threshold: ${diagnostics.backgroundStats.threshold.toFixed(2)}`,
    '',
    '--- Detection Results ---',
    `Total Stars Detected: ${diagnostics.detectionStats.totalStars}`,
    `Hot Pixels Filtered: ${diagnostics.detectionStats.filteredHotPixels}`,
    `Avg Signal-to-Noise: ${diagnostics.detectionStats.avgSignalToNoise.toFixed(2)}`,
    `Avg Contrast Ratio: ${diagnostics.detectionStats.avgContrast.toFixed(2)}`,
    '',
    '--- Bortle Scale Calculation ---',
    `Star Count: ${diagnostics.bortleCalculation.starCount}`,
    `Sky Brightness: ${diagnostics.bortleCalculation.skyBrightness.toFixed(2)}`,
    `Star Score: ${diagnostics.bortleCalculation.starScore.toFixed(2)}`,
    `Brightness Score: ${diagnostics.bortleCalculation.brightnessScore.toFixed(2)}`,
    `Final Bortle Scale: ${diagnostics.bortleCalculation.finalBortle}`,
    '',
    '======================================='
  ];
  
  return lines.join('\n');
}

/**
 * Compare two Bortle calculations to show improvement
 */
export interface BortleComparison {
  old: { bortle: number; method: string };
  new: { bortle: number; method: string };
  difference: number;
  improvement: 'better' | 'worse' | 'similar';
  explanation: string;
}

export function compareBortleCalculations(
  starCount: number,
  skyBrightness: number,
  oldBortle: number,
  newBortle: number,
  referenceData?: { actualBortle: number }
): BortleComparison {
  const difference = Math.abs(newBortle - oldBortle);
  
  let improvement: 'better' | 'worse' | 'similar' = 'similar';
  let explanation = '';
  
  if (referenceData) {
    const oldError = Math.abs(oldBortle - referenceData.actualBortle);
    const newError = Math.abs(newBortle - referenceData.actualBortle);
    
    if (newError < oldError - 0.5) {
      improvement = 'better';
      explanation = `New algorithm is ${(oldError - newError).toFixed(1)} Bortle units closer to reference value ${referenceData.actualBortle}.`;
    } else if (newError > oldError + 0.5) {
      improvement = 'worse';
      explanation = `New algorithm is ${(newError - oldError).toFixed(1)} Bortle units further from reference value ${referenceData.actualBortle}.`;
    } else {
      improvement = 'similar';
      explanation = `Both algorithms are within 0.5 Bortle units of reference value ${referenceData.actualBortle}.`;
    }
  } else {
    if (difference < 0.5) {
      improvement = 'similar';
      explanation = 'Algorithms produce similar results (difference < 0.5).';
    } else {
      explanation = `Algorithms differ by ${difference.toFixed(1)} Bortle units. Without reference data, cannot determine which is more accurate.`;
    }
  }
  
  return {
    old: { bortle: oldBortle, method: 'Original Algorithm' },
    new: { bortle: newBortle, method: 'Improved Algorithm' },
    difference,
    improvement,
    explanation
  };
}
