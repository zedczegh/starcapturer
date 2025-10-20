/**
 * Advanced Star Detection for Stereoscopic Processing
 * Borrowed from 3D Star Field Generator with enhancements for stereo depth
 */

export interface DetectedStar {
  centerX: number;
  centerY: number;
  brightness: number;
  size: number; // Actual size including diffraction spikes
  width: number; // Bounding box width
  height: number; // Bounding box height
  boundingBox: { x: number; y: number; width: number; height: number };
  color: { r: number; g: number; b: number };
  pattern: 'point' | 'small' | 'medium' | 'large' | 'complex';
  layer: number; // 0-4, based on size for depth layering
}

export interface StarDetectionParams {
  threshold?: number;        // Luminance threshold (default: 100)
  minStarSize?: number;      // Minimum pixels (default: 3)
  maxStarSize?: number;      // Maximum pixels (default: 500)
  minDistance?: number;      // Min distance between stars (default: 3)
  adaptiveThreshold?: number; // For spike detection (default: 0.3)
}

export class AdvancedStarDetector {
  private static readonly DEFAULT_PARAMS: StarDetectionParams = {
    threshold: 100,
    minStarSize: 3,
    maxStarSize: 500,
    minDistance: 3,
    adaptiveThreshold: 0.3
  };

  /**
   * Detect stars with diffraction spike analysis
   * Borrowed from StarFieldGenerator's extractStarPositions method
   */
  static detectStars(
    imageData: ImageData,
    width: number,
    height: number,
    params: StarDetectionParams = {}
  ): DetectedStar[] {
    const finalParams = { ...this.DEFAULT_PARAMS, ...params };
    const { threshold, minStarSize, maxStarSize, minDistance, adaptiveThreshold } = finalParams;
    
    const data = imageData.data;
    const stars: DetectedStar[] = [];
    const visited = new Uint8Array(width * height);
    
    console.log('🔍 Advanced star detection starting with params:', finalParams);
    
    // Scan for bright regions
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (visited[idx]) continue;
        
        const pixelIdx = idx * 4;
        const luminance = 0.299 * data[pixelIdx] + 0.587 * data[pixelIdx + 1] + 0.114 * data[pixelIdx + 2];
        
        if (luminance > threshold!) {
          // Found a bright pixel - grow the star region including spikes
          const starPixels: {x: number, y: number, lum: number}[] = [];
          const queue: {x: number, y: number}[] = [{x, y}];
          visited[idx] = 1;
          
          let minX = x, maxX = x, minY = y, maxY = y;
          let totalLum = 0, maxLum = 0;
          let totalX = 0, totalY = 0;
          
          // Region growing with 8-connected neighbors
          while (queue.length > 0 && starPixels.length < maxStarSize!) {
            const curr = queue.shift()!;
            const currIdx = curr.y * width + curr.x;
            const currPixelIdx = currIdx * 4;
            const currLum = 0.299 * data[currPixelIdx] + 0.587 * data[currPixelIdx + 1] + 0.114 * data[currPixelIdx + 2];
            
            starPixels.push({x: curr.x, y: curr.y, lum: currLum});
            totalLum += currLum;
            if (currLum > maxLum) maxLum = currLum;
            
            // Weighted centroid calculation
            const weight = currLum * currLum; // Square for emphasis
            totalX += curr.x * weight;
            totalY += curr.y * weight;
            
            minX = Math.min(minX, curr.x);
            maxX = Math.max(maxX, curr.x);
            minY = Math.min(minY, curr.y);
            maxY = Math.max(maxY, curr.y);
            
            // Check 8-connected neighbors for spike detection
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = curr.x + dx;
                const ny = curr.y + dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const nIdx = ny * width + nx;
                  if (!visited[nIdx]) {
                    const nPixelIdx = nIdx * 4;
                    const nLum = 0.299 * data[nPixelIdx] + 0.587 * data[nPixelIdx + 1] + 0.114 * data[nPixelIdx + 2];
                    
                    // Lower adaptive threshold to capture faint spikes
                    if (nLum > threshold! * adaptiveThreshold!) {
                      visited[nIdx] = 1;
                      queue.push({x: nx, y: ny});
                    }
                  }
                }
              }
            }
          }
          
          // Validate star region
          if (starPixels.length >= minStarSize! && starPixels.length <= maxStarSize!) {
            const totalWeight = starPixels.reduce((sum, p) => sum + p.lum * p.lum, 0);
            const centroidX = Math.round(totalX / totalWeight);
            const centroidY = Math.round(totalY / totalWeight);
            
            // Check minimum distance from existing stars
            const tooClose = stars.some(s => {
              const dx = s.centerX - centroidX;
              const dy = s.centerY - centroidY;
              return Math.sqrt(dx * dx + dy * dy) < minDistance!;
            });
            
            if (!tooClose) {
              const centerIdx = (centroidY * width + centroidX) * 4;
              
              // Calculate actual star size including spikes
              const starWidth = maxX - minX + 1;
              const starHeight = maxY - minY + 1;
              const actualSize = Math.max(starWidth, starHeight);
              
              // Classify pattern based on size
              let pattern: 'point' | 'small' | 'medium' | 'large' | 'complex';
              if (actualSize <= 5) pattern = 'point';
              else if (actualSize <= 15) pattern = 'small';
              else if (actualSize <= 30) pattern = 'medium';
              else if (actualSize <= 60) pattern = 'large';
              else pattern = 'complex';
              
              // Assign layer based on size (larger stars = closer = more displacement)
              // Layer 0: point stars (5px or less) - farthest
              // Layer 1: small stars (6-15px)
              // Layer 2: medium stars (16-30px)
              // Layer 3: large stars (31-60px)
              // Layer 4: complex stars (60px+) - closest
              let layer: number;
              if (actualSize <= 5) layer = 0;
              else if (actualSize <= 15) layer = 1;
              else if (actualSize <= 30) layer = 2;
              else if (actualSize <= 60) layer = 3;
              else layer = 4;
              
              stars.push({
                centerX: centroidX,
                centerY: centroidY,
                brightness: maxLum / 255,
                size: actualSize,
                width: starWidth,
                height: starHeight,
                boundingBox: {
                  x: minX,
                  y: minY,
                  width: starWidth,
                  height: starHeight
                },
                color: {
                  r: data[centerIdx],
                  g: data[centerIdx + 1],
                  b: data[centerIdx + 2]
                },
                pattern,
                layer
              });
            }
          }
        }
      }
    }
    
    // Sort by layer (larger/closer stars first)
    stars.sort((a, b) => b.layer - a.layer);
    
    console.log(`✅ Detected ${stars.length} stars with advanced algorithm`);
    console.log('Layer distribution:', {
      layer0: stars.filter(s => s.layer === 0).length,
      layer1: stars.filter(s => s.layer === 1).length,
      layer2: stars.filter(s => s.layer === 2).length,
      layer3: stars.filter(s => s.layer === 3).length,
      layer4: stars.filter(s => s.layer === 4).length
    });
    
    return stars;
  }

  /**
   * Calculate displacement amount for a star based on its layer and depth map value
   * @param layer Star layer (0-4) based on size
   * @param baseShift Base displacement amount in pixels
   * @param depthValue Depth map value at star position (0.0 = far/dim, 1.0 = near/bright)
   */
  static getLayerDisplacement(
    layer: number, 
    baseShift: number, 
    depthValue: number = 0.5
  ): number {
    // CORRECTED DIRECTION: For RIGHT image in stereo pairs
    // We start with ALL stars shifted LEFT (behind nebula)
    // Then we adjust based on size:
    // - Small stars: shift FURTHER LEFT (more negative) = push further back
    // - Large stars: shift RIGHT (positive) = bring forward toward viewer
    const layerMultipliers = [
      1.5,   // Layer 0 (point stars) - MAXIMUM forward (closest to viewer)
      0.8,   // Layer 1 (small stars) - moderate forward
      0.3,   // Layer 2 (medium stars) - slight forward from background
      -0.4,  // Layer 3 (large stars) - PUSH BACK behind nebula
      -0.8   // Layer 4 (complex stars) - PUSH FAR BACK (furthest from viewer)
    ];
    
    // Depth map modulation: brighter nebula = stronger effect
    const depthMultiplier = 0.2 + (depthValue * 1.8);
    
    // Combine layer size with depth position
    const layerShift = baseShift * layerMultipliers[layer];
    const depthModulatedShift = layerShift * depthMultiplier;
    
    return depthModulatedShift;
  }
}
