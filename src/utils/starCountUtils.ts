
/**
 * Utility functions for star counting and sky brightness analysis
 * These help improve the accuracy of Bortle scale measurements
 */

/**
 * Count stars in image data
 * @param imageData Raw image data from camera
 * @returns Number of stars detected
 */
export function countStarsInImage(imageData: ImageData): number {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Threshold values for star detection
  const brightnessThreshold = 180; // Higher values are more likely to be stars
  const contrastThreshold = 50;    // Minimum difference from background
  
  let starCount = 0;
  const starPixels = new Set(); // To avoid counting the same star multiple times
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      
      // Calculate pixel brightness (simple average of RGB)
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      
      // Check surrounding pixels to see if this is a local maximum (star center)
      if (brightness > brightnessThreshold) {
        let isLocalMax = true;
        
        // Check 8 surrounding pixels
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue; // Skip the center pixel
            
            const ni = ((y + dy) * width + (x + dx)) * 4;
            const neighborBrightness = (data[ni] + data[ni + 1] + data[ni + 2]) / 3;
            
            // If a neighboring pixel is brighter, this is not a local max
            if (neighborBrightness > brightness) {
              isLocalMax = false;
              break;
            }
          }
          if (!isLocalMax) break;
        }
        
        if (isLocalMax) {
          // Ensure this is not part of a star we've already counted
          const starKey = `${x}-${y}`;
          if (!starPixels.has(starKey)) {
            starCount++;
            
            // Mark this and nearby pixels as part of a star
            for (let dy = -2; dy <= 2; dy++) {
              for (let dx = -2; dx <= 2; dx++) {
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
  }
  
  return starCount;
}

/**
 * Calculate Bortle scale based on star count and brightness
 * @param starCount Number of stars detected in the image
 * @param skyBrightness Average brightness value of the sky (0-255)
 * @returns Estimated Bortle scale (1-9)
 */
export function calculateBortleFromStars(starCount: number, skyBrightness: number): number {
  // Normalize star count to a value between 0-10
  // Typical range: 0 stars (urban) to 100+ stars (dark site) in a typical smartphone frame
  const normalizedStarCount = Math.min(10, starCount / 10);
  
  // Normalize brightness (0-255) to a reversed 0-10 scale (darker is better)
  // 255 (white) would be 0, and 0 (black) would be 10
  const normalizedBrightness = 10 - (skyBrightness / 25.5);
  
  // Combine the two metrics with more weight to brightness (70/30 split)
  const combinedMetric = (normalizedBrightness * 0.7) + (normalizedStarCount * 0.3);
  
  // Convert the 0-10 scale to Bortle 1-9 scale (reversed)
  // 9 is most light-polluted, 1 is darkest sky
  let bortle = 10 - combinedMetric;
  
  // Ensure Bortle is in valid range 1-9
  bortle = Math.max(1, Math.min(9, bortle));
  
  return bortle;
}

/**
 * Estimate star visibility based on Bortle scale
 * @param bortleScale Bortle scale value (1-9)
 * @returns Approximate number of stars visible in a typical frame
 */
export function estimateStarCountFromBortle(bortleScale: number): number {
  // This is an approximation based on typical expectations
  // Bortle 1: 100+ stars visible in frame
  // Bortle 9: < 10 stars visible
  
  if (bortleScale <= 1) return 100 + Math.floor(Math.random() * 50);
  if (bortleScale >= 9) return Math.max(0, Math.floor(Math.random() * 10));
  
  // Linear interpolation between these extremes
  const baseCount = Math.max(0, Math.floor(100 * (1 - (bortleScale - 1) / 8)));
  
  // Add some randomness to make it more realistic
  return baseCount + Math.floor(Math.random() * 20) - 10;
}

/**
 * Convert star count to a descriptive label
 * @param count Approximate star count
 * @returns Description of star visibility
 */
export function getStarVisibilityLabel(count: number): "exceptional" | "many" | "some" | "few" | "very few" {
  if (count >= 80) return "exceptional";
  if (count >= 40) return "many";
  if (count >= 20) return "some";
  if (count >= 10) return "few";
  return "very few";
}
