
/**
 * Utilities for counting stars in images and calculating Bortle scale
 * This enables more accurate Bortle scale determination based on direct observation
 */

/**
 * Count stars in an image using pixel brightness analysis
 * @param imageData Image data from canvas
 * @returns Estimated star count
 */
export function countStarsInImage(imageData: ImageData): number {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // Parameters for star detection
  const brightnessTolerance = 80; // Higher = more stars detected
  const minBrightness = 150; // Minimum pixel brightness to be considered a star
  const minStarSize = 2; // Minimum star size in pixels
  const maxStarSize = 20; // Maximum star size in pixels
  
  // Track visited pixels to avoid counting the same star twice
  const visited = new Set<number>();
  
  // Stars found
  let starCount = 0;
  
  // Helper to get pixel index
  const getPixelIndex = (x: number, y: number) => (y * width + x) * 4;
  
  // Helper to get pixel brightness
  const getBrightness = (index: number) => {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    return (r + g + b) / 3;
  };
  
  // Helper to check if a pixel is a star
  const isStarPixel = (index: number) => {
    const brightness = getBrightness(index);
    return brightness >= minBrightness;
  };
  
  // Flood fill algorithm to find connected star pixels
  const floodFill = (startX: number, startY: number) => {
    const stack = [{x: startX, y: startY}];
    let size = 0;
    
    while (stack.length > 0) {
      const {x, y} = stack.pop()!;
      const index = getPixelIndex(x, y);
      
      // Skip if already visited or out of bounds
      if (x < 0 || x >= width || y < 0 || y >= height || visited.has(index)) {
        continue;
      }
      
      // Skip if not bright enough
      if (!isStarPixel(index)) {
        continue;
      }
      
      // Mark as visited
      visited.add(index);
      size++;
      
      // Add neighbors to stack
      stack.push({x: x + 1, y: y});
      stack.push({x: x - 1, y: y});
      stack.push({x: x, y: y + 1});
      stack.push({x: x, y: y - 1});
    }
    
    // Only count as a star if size is within limits
    return size >= minStarSize && size <= maxStarSize;
  };
  
  // Scan the image for stars
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = getPixelIndex(x, y);
      
      // Skip if already visited
      if (visited.has(index)) {
        continue;
      }
      
      // Check if this pixel is bright enough to be a star
      if (isStarPixel(index)) {
        // Use flood fill to find the entire star
        if (floodFill(x, y)) {
          starCount++;
        }
      }
    }
  }
  
  return starCount;
}

/**
 * Calculate Bortle scale from star count and average sky brightness
 * 
 * @param starCount Number of stars visible
 * @param avgBrightness Average brightness of the sky
 * @returns Calculated Bortle scale (1-9)
 */
export function calculateBortleFromStars(starCount: number, avgBrightness: number): number {
  // Normalize star count based on image size (assuming 1080p image)
  // This would need to be adjusted for different image sizes
  const normalizedStarCount = starCount * (1920 * 1080) / (1920 * 1080);
  
  // Adjust for sky brightness (darker sky = more visible stars)
  const brightnessAdjustment = Math.max(0, (128 - avgBrightness) / 128);
  const adjustedStarCount = normalizedStarCount * (1 + brightnessAdjustment);
  
  // Map adjusted star count to Bortle scale
  // These thresholds are approximate and would need calibration
  if (adjustedStarCount > 5000) return 1;       // Excellent dark-sky site
  if (adjustedStarCount > 2500) return 2;       // Typical truly dark site
  if (adjustedStarCount > 1200) return 3;       // Rural sky
  if (adjustedStarCount > 600) return 4;        // Rural/suburban transition
  if (adjustedStarCount > 300) return 5;        // Suburban sky
  if (adjustedStarCount > 150) return 6;        // Bright suburban sky
  if (adjustedStarCount > 50) return 7;         // Suburban/urban transition
  if (adjustedStarCount > 20) return 8;         // City sky
  return 9;                                    // Inner city sky
}
