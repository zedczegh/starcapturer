
/**
 * Utility functions for star counting and sky brightness analysis
 * These help improve the accuracy of Bortle scale measurements
 */

/**
 * Enhanced star detection algorithm with advanced pattern recognition
 * @param imageData Raw image data from camera
 * @returns Number of stars detected
 */
export function countStarsInImage(imageData: ImageData): number {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Improved adaptive threshold values based on astronomical research
  const minStarSize = 2;          // Minimum size in pixels to be considered a star
  
  let starCount = 0;
  const starPixels = new Set(); // To avoid counting the same star multiple times
  
  // First pass: calculate background luminance for adaptive thresholding
  let totalLuminance = 0;
  let pixelCount = 0;
  const brightPixels = [];
  
  for (let y = 0; y < height; y += 3) { // Sample every 3rd pixel for better performance/accuracy balance
    for (let x = 0; x < width; x += 3) {
      const i = (y * width + x) * 4;
      const pixelBrightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      totalLuminance += pixelBrightness;
      pixelCount++;
      
      if (pixelBrightness > 160) { // Pre-filter potential star candidates
        brightPixels.push({ x, y, brightness: pixelBrightness });
      }
    }
  }
  
  // Calculate average background luminance and standard deviation
  const avgLuminance = totalLuminance / pixelCount;
  
  // Calculate standard deviation for dynamic threshold
  let variance = 0;
  for (let y = 0; y < height; y += 6) { // Coarser sampling for variance calculation
    for (let x = 0; x < width; x += 6) {
      const i = (y * width + x) * 4;
      const pixelBrightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      variance += Math.pow(pixelBrightness - avgLuminance, 2);
    }
  }
  const stdDev = Math.sqrt(variance / (pixelCount / 36)); // Adjust for sampling rate
  
  // Adjust threshold based on background luminance and standard deviation
  // This adapts to both very dark and light polluted areas
  const adaptiveBrightnessThreshold = avgLuminance + (stdDev * 2.5);
  const contrastThreshold = Math.max(35, stdDev * 1.2); // Dynamic contrast threshold
  
  // Process pre-filtered bright pixels for star detection
  for (const pixel of brightPixels) {
    const { x, y, brightness } = pixel;
    
    // Skip already counted stars
    const starKey = `${x}-${y}`;
    if (starPixels.has(starKey)) continue;
    
    // Skip pixels below adaptive threshold
    if (brightness <= adaptiveBrightnessThreshold) continue;
    
    // Check if this could be a star center
    let isLocalMax = true;
    let surroundingBrightness = 0;
    let surroundingCount = 0;
    
    // Check 8 surrounding pixels
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue; // Skip the center pixel
        
        const nx = x + dx;
        const ny = y + dy;
        
        // Make sure neighbor is within bounds
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        
        const ni = ((y + dy) * width + (x + dx)) * 4;
        const neighborBrightness = (data[ni] * 0.299 + data[ni + 1] * 0.587 + data[ni + 2] * 0.114);
        
        surroundingBrightness += neighborBrightness;
        surroundingCount++;
        
        // If a neighboring pixel is brighter, this is not a local max
        if (neighborBrightness > brightness) {
          isLocalMax = false;
          break;
        }
      }
      if (!isLocalMax) break;
    }
    
    // Calculate contrast with surrounding pixels
    if (isLocalMax && surroundingCount > 0) {
      const avgSurroundingBrightness = surroundingBrightness / surroundingCount;
      const contrast = brightness - avgSurroundingBrightness;
      
      // Additional circular pattern detection for star authenticity
      let isCircular = true;
      if (contrast > contrastThreshold) {
        // Check if brightness pattern follows circular distribution (characteristic of stars)
        const checkRadius = 2;
        const angleSteps = 8; // Check in 8 directions
        let radialBrightness = 0;
        let radialCount = 0;
        
        for (let angle = 0; angle < Math.PI * 2; angle += (Math.PI * 2 / angleSteps)) {
          const rx = Math.round(x + checkRadius * Math.cos(angle));
          const ry = Math.round(y + checkRadius * Math.sin(angle));
          
          if (rx >= 0 && rx < width && ry >= 0 && ry < height) {
            const ri = (ry * width + rx) * 4;
            const radialPixelBrightness = (data[ri] * 0.299 + data[ri + 1] * 0.587 + data[ri + 2] * 0.114);
            radialBrightness += radialPixelBrightness;
            radialCount++;
            
            // Star brightness should decay with distance - check if it's significantly dimmer
            if (radialPixelBrightness > brightness * 0.9) {
              isCircular = false;
              break;
            }
          }
        }
        
        // Final check - if it passed all criteria, count as a star
        if (isCircular && radialCount > angleSteps / 2) {
          starCount++;
          
          // Mark this and nearby pixels as part of a star (radius based on brightness)
          const starRadius = Math.min(4, Math.max(2, Math.floor(contrast / 25)));
          for (let dy = -starRadius; dy <= starRadius; dy++) {
            for (let dx = -starRadius; dx <= starRadius; dx++) {
              const sx = x + dx;
              const sy = y + dy;
              if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
                starPixels.add(`${sx}-${sy}`);
              }
            }
          }
        }
      }
    }
  }
  
  // Apply correction for very bright images (potential light pollution affecting detection)
  if (avgLuminance > 180) {
    // In bright skies, we've likely overestimated due to noise or light sources
    starCount = Math.max(0, Math.floor(starCount * 0.7));
  } 
  // Apply correction for very dark images (potential underestimation)
  else if (avgLuminance < 40 && starCount < 20) {
    // In very dark skies with few detected stars, we might have missed some
    starCount = Math.floor(starCount * 1.2);
  }
  
  return starCount;
}

/**
 * Calculate Bortle scale based on star count and brightness with improved algorithm
 * @param starCount Number of stars detected in the image
 * @param skyBrightness Average brightness value of the sky (0-255)
 * @returns Estimated Bortle scale (1-9)
 */
export function calculateBortleFromStars(starCount: number, skyBrightness: number): number {
  // Enhanced normalization with non-linear scaling for better accuracy
  // Based on research of star visibility vs. Bortle scale
  let normalizedStarCount = 0;
  
  // Non-linear star count scaling that better matches observed data
  if (starCount <= 10) {
    normalizedStarCount = starCount / 10 * 3; // Low star counts map to Bortle 7-9
  } else if (starCount <= 50) {
    normalizedStarCount = 3 + (starCount - 10) / 40 * 3; // Medium star counts map to Bortle 4-6
  } else {
    normalizedStarCount = 6 + Math.min(4, (starCount - 50) / 150 * 4); // High star counts map to Bortle 1-3
  }
  
  // Improved sky brightness processing with perceptual mapping
  // This better reflects how light pollution affects star visibility
  const brightnessImpact = Math.pow(skyBrightness / 255, 0.7) * 10;
  const normalizedBrightness = 10 - brightnessImpact;
  
  // Weighted combination with star count given higher priority (65/35 split)
  // Based on research showing star count is more reliable than general sky brightness
  const combinedMetric = (normalizedStarCount * 0.65) + (normalizedBrightness * 0.35);
  
  // Map combined metric to Bortle scale with improved accuracy at extremes
  let bortle = 0;
  if (combinedMetric >= 9.5) bortle = 1;
  else if (combinedMetric >= 8.5) bortle = 1.5;
  else if (combinedMetric >= 7.5) bortle = 2;
  else if (combinedMetric >= 6.5) bortle = 2.5;
  else if (combinedMetric >= 5.5) bortle = 3;
  else if (combinedMetric >= 4.5) bortle = 3.5;
  else if (combinedMetric >= 4.0) bortle = 4;
  else if (combinedMetric >= 3.5) bortle = 4.5;
  else if (combinedMetric >= 3.0) bortle = 5;
  else if (combinedMetric >= 2.5) bortle = 5.5;
  else if (combinedMetric >= 2.0) bortle = 6;
  else if (combinedMetric >= 1.5) bortle = 6.5;
  else if (combinedMetric >= 1.0) bortle = 7;
  else if (combinedMetric >= 0.7) bortle = 7.5;
  else if (combinedMetric >= 0.4) bortle = 8;
  else if (combinedMetric >= 0.2) bortle = 8.5;
  else bortle = 9;
  
  return bortle;
}

/**
 * Estimate star visibility based on Bortle scale with improved accuracy
 * @param bortleScale Bortle scale value (1-9)
 * @returns Approximate number of stars visible in a typical frame
 */
export function estimateStarCountFromBortle(bortleScale: number): number {
  // Enhanced estimation based on astronomical research
  // Bortle 1: 150+ stars visible in frame with typical smartphone
  // Bortle 9: < 5 stars visible
  
  // Use exponential decay function for more accurate mapping
  // Stars visible drops exponentially with increasing Bortle scale
  if (bortleScale <= 1) return 150 + Math.floor(Math.random() * 50);
  if (bortleScale >= 9) return Math.max(0, Math.floor(Math.random() * 5));
  
  // Exponential decay function: stars = baseStars * e^(-k * bortleScale)
  const baseStars = 200;
  const decayFactor = 0.4;
  const estimatedCount = Math.floor(baseStars * Math.exp(-decayFactor * (bortleScale - 1)));
  
  // Add small random variation to make it more realistic
  const variationPercent = 0.15; // 15% variation
  const randomVariation = Math.floor((Math.random() * 2 - 1) * estimatedCount * variationPercent);
  
  return Math.max(0, estimatedCount + randomVariation);
}

/**
 * Convert star count to a descriptive label with more accurate thresholds
 * @param count Approximate star count
 * @returns Description of star visibility
 */
export function getStarVisibilityLabel(count: number): "exceptional" | "many" | "some" | "few" | "very few" {
  if (count >= 100) return "exceptional";
  if (count >= 50) return "many";
  if (count >= 20) return "some";
  if (count >= 8) return "few";
  return "very few";
}
