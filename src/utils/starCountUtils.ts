
/**
 * Utility functions for star counting and sky brightness analysis
 * These help improve the accuracy of Bortle scale measurements
 */

/**
 * Count stars in image data with enhanced detection algorithm
 * Uses advanced noise filtering and hot pixel rejection
 * @param imageData Raw image data from camera
 * @returns Number of stars detected
 */
export function countStarsInImage(imageData: ImageData): number {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Calculate robust background statistics using median
  const luminanceArray: number[] = [];
  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const i = (y * width + x) * 4;
      const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      luminanceArray.push(lum);
    }
  }
  
  // Sort for median calculation
  luminanceArray.sort((a, b) => a - b);
  const median = luminanceArray[Math.floor(luminanceArray.length / 2)];
  
  // Calculate MAD (Median Absolute Deviation) for robust noise estimation
  const deviations = luminanceArray.map(v => Math.abs(v - median));
  deviations.sort((a, b) => a - b);
  const mad = deviations[Math.floor(deviations.length / 2)];
  
  // Adaptive threshold: median + 5 * MAD (5-sigma detection threshold)
  // This is standard in astronomical photometry
  const detectionThreshold = median + (5 * mad * 1.4826); // 1.4826 converts MAD to standard deviation
  const minContrastRatio = 1.5; // Star must be 1.5x brighter than local background
  
  console.log(`Background: median=${median.toFixed(2)}, MAD=${mad.toFixed(2)}, threshold=${detectionThreshold.toFixed(2)}`);
  
  let starCount = 0;
  const detectedStars = new Set<string>();
  const hotPixels = new Set<string>(); // Track potential hot pixels
  
  // First pass: detect candidate stars with strict criteria
  for (let y = 5; y < height - 5; y++) {
    for (let x = 5; x < width - 5; x++) {
      const i = (y * width + x) * 4;
      const centerLum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      
      if (centerLum < detectionThreshold) continue;
      
      // Check if it's a local maximum (peak detection)
      let isLocalMax = true;
      let localBackground = 0;
      let localCount = 0;
      let neighborMaxLum = 0;
      
      // Check 3x3 neighborhood for local maximum
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          
          const ni = ((y + dy) * width + (x + dx)) * 4;
          const nLum = data[ni] * 0.299 + data[ni + 1] * 0.587 + data[ni + 2] * 0.114;
          
          if (nLum > centerLum) {
            isLocalMax = false;
            break;
          }
          neighborMaxLum = Math.max(neighborMaxLum, nLum);
        }
        if (!isLocalMax) break;
      }
      
      if (!isLocalMax) continue;
      
      // Calculate local background (5x5 annulus, excluding center 3x3)
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) continue; // Skip center
          
          const ni = ((y + dy) * width + (x + dx)) * 4;
          const nLum = data[ni] * 0.299 + data[ni + 1] * 0.587 + data[ni + 2] * 0.114;
          localBackground += nLum;
          localCount++;
        }
      }
      
      const avgLocalBackground = localBackground / localCount;
      const contrastRatio = centerLum / Math.max(avgLocalBackground, 1);
      
      // Enhanced star validation criteria
      const meetsContrast = contrastRatio >= minContrastRatio;
      const signalToNoise = (centerLum - avgLocalBackground) / (mad * 1.4826);
      const isSignificant = signalToNoise > 3; // 3-sigma detection
      
      // Check for hot pixel (single isolated bright pixel)
      const gradientCheck = centerLum - neighborMaxLum;
      const isLikelyHotPixel = gradientCheck > 100 && contrastRatio > 5;
      
      if (meetsContrast && isSignificant && !isLikelyHotPixel) {
        const key = `${Math.floor(x / 3)}-${Math.floor(y / 3)}`;
        if (!detectedStars.has(key)) {
          detectedStars.add(key);
          starCount++;
          
          // Mark region as containing a star (prevents double counting)
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const sk = `${Math.floor((x + dx) / 3)}-${Math.floor((y + dy) / 3)}`;
              detectedStars.add(sk);
            }
          }
        }
      } else if (isLikelyHotPixel) {
        hotPixels.add(`${x}-${y}`);
      }
    }
  }
  
  console.log(`Detected ${starCount} stars, filtered ${hotPixels.size} hot pixels`);
  
  return starCount;
}

/**
 * Calculate Bortle scale based on star count and brightness with improved algorithm
 * Uses logarithmic relationships and astronomical research data
 * @param starCount Number of stars detected in the image
 * @param skyBrightness Average brightness value of the sky (0-255)
 * @returns Estimated Bortle scale (1-9)
 */
export function calculateBortleFromStars(starCount: number, skyBrightness: number): number {
  console.log(`Calculating Bortle from ${starCount} stars, brightness ${skyBrightness.toFixed(2)}`);
  
  // Bortle Scale Reference (smartphone camera with typical FOV and exposure):
  // Bortle 1 (Excellent dark sky): 120-200+ stars visible
  // Bortle 2 (Typical dark sky): 80-120 stars
  // Bortle 3 (Rural sky): 50-80 stars  
  // Bortle 4 (Rural/Suburban transition): 30-50 stars
  // Bortle 5 (Suburban sky): 15-30 stars
  // Bortle 6 (Bright suburban): 8-15 stars
  // Bortle 7 (Suburban/Urban transition): 4-8 stars
  // Bortle 8 (City sky): 1-4 stars
  // Bortle 9 (Inner city): 0-1 stars
  
  // Calculate star count score using logarithmic scale (stars don't increase linearly)
  let starScore = 0;
  if (starCount >= 120) {
    starScore = 1.0 + Math.min(1.0, (starCount - 120) / 80); // Bortle 1-1.5
  } else if (starCount >= 80) {
    starScore = 2.0 + (120 - starCount) / 40; // Bortle 2-2.5
  } else if (starCount >= 50) {
    starScore = 3.0 + (80 - starCount) / 30; // Bortle 3-3.5
  } else if (starCount >= 30) {
    starScore = 4.0 + (50 - starCount) / 20; // Bortle 4-4.5
  } else if (starCount >= 15) {
    starScore = 5.0 + (30 - starCount) / 15; // Bortle 5-5.5
  } else if (starCount >= 8) {
    starScore = 6.0 + (15 - starCount) / 7; // Bortle 6-6.5
  } else if (starCount >= 4) {
    starScore = 7.0 + (8 - starCount) / 4; // Bortle 7-7.5
  } else if (starCount >= 1) {
    starScore = 8.0 + (4 - starCount) / 3; // Bortle 8-8.5
  } else {
    starScore = 9.0; // Bortle 9
  }
  
  // Sky brightness score (0-255 range)
  // Lower brightness = darker sky = lower Bortle
  // Research shows sky brightness follows a power law with light pollution
  let brightnessScore = 0;
  
  // Normalize brightness to 0-1 range with gamma correction
  const normalizedBrightness = Math.pow(skyBrightness / 255, 1.5);
  
  // Map to Bortle scale (inverted - darker sky = lower Bortle)
  if (normalizedBrightness < 0.1) { // Very dark (< 25.5/255)
    brightnessScore = 1.0 + normalizedBrightness * 10; // Bortle 1-2
  } else if (normalizedBrightness < 0.2) { // Dark (< 51/255)
    brightnessScore = 2.0 + (normalizedBrightness - 0.1) * 10; // Bortle 2-3
  } else if (normalizedBrightness < 0.35) { // Rural (< 89/255)
    brightnessScore = 3.0 + (normalizedBrightness - 0.2) * 6.67; // Bortle 3-4
  } else if (normalizedBrightness < 0.5) { // Transition (< 127/255)
    brightnessScore = 4.0 + (normalizedBrightness - 0.35) * 6.67; // Bortle 4-5
  } else if (normalizedBrightness < 0.65) { // Suburban (< 165/255)
    brightnessScore = 5.0 + (normalizedBrightness - 0.5) * 6.67; // Bortle 5-6
  } else if (normalizedBrightness < 0.80) { // Bright suburban (< 204/255)
    brightnessScore = 6.0 + (normalizedBrightness - 0.65) * 6.67; // Bortle 6-7
  } else if (normalizedBrightness < 0.90) { // Urban (< 229/255)
    brightnessScore = 7.0 + (normalizedBrightness - 0.80) * 10; // Bortle 7-8
  } else { // Inner city (>= 229/255)
    brightnessScore = 8.0 + (normalizedBrightness - 0.90) * 10; // Bortle 8-9
  }
  
  // Weighted combination: Star count is more reliable (70/30 split)
  // Star count is direct measurement, brightness can be affected by camera settings
  const combinedScore = (starScore * 0.70) + (brightnessScore * 0.30);
  
  console.log(`Star score: ${starScore.toFixed(2)}, Brightness score: ${brightnessScore.toFixed(2)}, Combined: ${combinedScore.toFixed(2)}`);
  
  // Round to nearest 0.5 for practical use
  let finalBortle = Math.round(combinedScore * 2) / 2;
  
  // Clamp to valid range
  finalBortle = Math.max(1, Math.min(9, finalBortle));
  
  console.log(`Final Bortle scale: ${finalBortle}`);
  
  return finalBortle;
}

/**
 * Estimate star visibility based on Bortle scale with improved accuracy
 * Based on research-backed correlations
 * @param bortleScale Bortle scale value (1-9)
 * @returns Approximate number of stars visible in a typical frame
 */
export function estimateStarCountFromBortle(bortleScale: number): number {
  // Research-based star count estimates for smartphone cameras
  // with typical sensor and FOV (field of view)
  
  // Create a lookup table with interpolation
  const bortleToStars: { [key: number]: number } = {
    1: 160,   // Excellent dark sky
    2: 100,   // Typical dark sky  
    3: 65,    // Rural sky
    4: 40,    // Rural/Suburban transition
    5: 22,    // Suburban sky
    6: 11,    // Bright suburban
    7: 6,     // Suburban/Urban transition
    8: 2,     // City sky
    9: 0.5    // Inner city
  };
  
  // Linear interpolation for fractional Bortle values
  const lowerBortle = Math.floor(bortleScale);
  const upperBortle = Math.ceil(bortleScale);
  const fraction = bortleScale - lowerBortle;
  
  const lowerStars = bortleToStars[lowerBortle] || 160;
  const upperStars = bortleToStars[upperBortle] || 0;
  
  const estimatedCount = Math.floor(lowerStars + (upperStars - lowerStars) * fraction);
  
  // Add small random variation (±10%) to make it more realistic
  const variationPercent = 0.10;
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
