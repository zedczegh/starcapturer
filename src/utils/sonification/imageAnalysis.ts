
/**
 * Advanced astronomical image analysis utilities
 * Inspired by professional astronomy image processing tools
 */

interface ImageStats {
  mean: number;
  std: number;
  median: number;
  mad: number; // Median Absolute Deviation
}

interface DetectionResult {
  stars: number;
  nebulae: number;
  galaxies: number;
  starMask: boolean[];
  nebulaMask: boolean[];
  galaxyMask: boolean[];
}

/**
 * Calculate robust statistics for astronomical images
 */
export function calculateImageStats(data: Uint8ClampedArray, width: number, height: number): ImageStats {
  const luminanceValues: number[] = [];
  
  // Convert to luminance and collect values
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    luminanceValues.push(luminance);
  }
  
  // Calculate basic statistics
  const mean = luminanceValues.reduce((sum, val) => sum + val, 0) / luminanceValues.length;
  const variance = luminanceValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / luminanceValues.length;
  const std = Math.sqrt(variance);
  
  // Calculate robust statistics
  const sorted = [...luminanceValues].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const mad = sorted.map(val => Math.abs(val - median)).sort((a, b) => a - b)[Math.floor(sorted.length / 2)];
  
  return { mean, std, median, mad };
}

/**
 * Advanced star detection using morphological operations and statistical analysis
 */
export function detectStars(imageData: ImageData, threshold?: number): { count: number; mask: boolean[] } {
  const { data, width, height } = imageData;
  const stats = calculateImageStats(data, width, height);
  
  // Adaptive threshold based on image statistics
  const adaptiveThreshold = threshold || Math.max(
    stats.median + 3 * stats.mad, // 3-sigma clipping
    stats.mean + 2 * stats.std
  );
  
  const starMask = new Array(width * height).fill(false);
  const candidates: Array<{x: number, y: number, intensity: number, size: number}> = [];
  
  // First pass: Find bright pixels above threshold
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const i = (y * width + x) * 4;
      const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      
      if (luminance > adaptiveThreshold) {
        // Check if this is a local maximum
        let isLocalMax = true;
        let neighborSum = 0;
        let neighborCount = 0;
        
        // Check 3x3 neighborhood
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const ni = ((y + dy) * width + (x + dx)) * 4;
            const neighborLum = 0.299 * data[ni] + 0.587 * data[ni + 1] + 0.114 * data[ni + 2];
            
            if (neighborLum > luminance) {
              isLocalMax = false;
              break;
            }
            
            neighborSum += neighborLum;
            neighborCount++;
          }
          if (!isLocalMax) break;
        }
        
        if (isLocalMax) {
          const avgNeighbor = neighborSum / neighborCount;
          const contrast = luminance - avgNeighbor;
          
          // Calculate star size using connected component analysis
          const starSize = calculateStarSize(data, width, height, x, y, adaptiveThreshold * 0.7);
          
          // Filter based on size and contrast
          if (contrast > stats.mad * 2 && starSize >= 1 && starSize <= 50) {
            candidates.push({ x, y, intensity: luminance, size: starSize });
          }
        }
      }
    }
  }
  
  // Remove overlapping detections (non-maximum suppression)
  const filteredStars = nonMaximumSuppression(candidates, 3);
  
  // Mark star pixels in mask
  filteredStars.forEach(star => {
    markStarRegion(starMask, width, height, star.x, star.y, star.size);
  });
  
  return { count: filteredStars.length, mask: starMask };
}

/**
 * Advanced nebula detection using texture analysis and color information
 */
export function detectNebulae(imageData: ImageData, starMask: boolean[]): { count: number; mask: boolean[] } {
  const { data, width, height } = imageData;
  const nebulaMask = new Array(width * height).fill(false);
  
  // Calculate color variance and texture measures
  const colorVarianceMap = calculateColorVariance(data, width, height);
  const textureMap = calculateTexture(data, width, height);
  
  let nebulaRegions = 0;
  const visited = new Array(width * height).fill(false);
  
  // Scan for nebula regions
  for (let y = 5; y < height - 5; y++) {
    for (let x = 5; x < width - 5; x++) {
      const idx = y * width + x;
      
      if (visited[idx] || starMask[idx]) continue;
      
      const colorVar = colorVarianceMap[idx];
      const texture = textureMap[idx];
      
      // Nebula criteria: high color variance, medium texture, extended structure
      if (colorVar > 30 && texture > 0.1 && texture < 0.8) {
        const region = floodFillRegion(data, width, height, x, y, starMask, visited, 
                                     (r, g, b, cx, cy) => {
                                       const cv = colorVarianceMap[cy * width + cx];
                                       const tx = textureMap[cy * width + cx];
                                       return cv > 20 && tx > 0.05;
                                     });
        
        // Check if region is large enough to be a nebula
        if (region.size > 100 && region.size < 50000) {
          nebulaRegions++;
          region.pixels.forEach(([px, py]) => {
            nebulaMask[py * width + px] = true;
          });
        }
      }
    }
  }
  
  return { count: nebulaRegions, mask: nebulaMask };
}

/**
 * Advanced galaxy detection using morphological analysis
 */
export function detectGalaxies(imageData: ImageData, starMask: boolean[], nebulaMask: boolean[]): { count: number; mask: boolean[] } {
  const { data, width, height } = imageData;
  const galaxyMask = new Array(width * height).fill(false);
  
  // Calculate gradient magnitude for edge detection
  const gradientMap = calculateGradientMagnitude(data, width, height);
  const ellipticityMap = calculateEllipticity(data, width, height);
  
  let galaxyCount = 0;
  const visited = new Array(width * height).fill(false);
  
  // Scan for galaxy-like structures
  for (let y = 10; y < height - 10; y++) {
    for (let x = 10; x < width - 10; x++) {
      const idx = y * width + x;
      
      if (visited[idx] || starMask[idx] || nebulaMask[idx]) continue;
      
      const gradient = gradientMap[idx];
      const ellipticity = ellipticityMap[idx];
      
      // Galaxy criteria: structured edges, elliptical shape, moderate brightness
      if (gradient > 15 && ellipticity > 0.3) {
        const region = floodFillRegion(data, width, height, x, y, 
                                     [...starMask, ...nebulaMask], visited,
                                     (r, g, b, cx, cy) => {
                                       const grd = gradientMap[cy * width + cx];
                                       const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                                       return grd > 8 && lum > 50 && lum < 200;
                                     });
        
        // Check if region has galaxy-like properties
        if (region.size > 500 && region.size < 20000) {
          const aspectRatio = calculateAspectRatio(region.pixels);
          const compactness = calculateCompactness(region.pixels, region.size);
          
          if (aspectRatio > 1.2 && aspectRatio < 8 && compactness > 0.4) {
            galaxyCount++;
            region.pixels.forEach(([px, py]) => {
              galaxyMask[py * width + px] = true;
            });
          }
        }
      }
    }
  }
  
  return { count: galaxyCount, mask: galaxyMask };
}

// Helper functions

function calculateStarSize(data: Uint8ClampedArray, width: number, height: number, 
                          centerX: number, centerY: number, threshold: number): number {
  let size = 0;
  const visited = new Set<string>();
  const stack = [[centerX, centerY]];
  
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const key = `${x},${y}`;
    
    if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) continue;
    visited.add(key);
    
    const i = (y * width + x) * 4;
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    
    if (luminance > threshold) {
      size++;
      if (size > 50) break; // Prevent runaway growth
      
      // Add neighbors
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          stack.push([x + dx, y + dy]);
        }
      }
    }
  }
  
  return size;
}

function nonMaximumSuppression(candidates: Array<{x: number, y: number, intensity: number, size: number}>, 
                              radius: number): Array<{x: number, y: number, intensity: number, size: number}> {
  const sorted = candidates.sort((a, b) => b.intensity - a.intensity);
  const kept: Array<{x: number, y: number, intensity: number, size: number}> = [];
  
  for (const candidate of sorted) {
    let shouldKeep = true;
    
    for (const existing of kept) {
      const distance = Math.sqrt(Math.pow(candidate.x - existing.x, 2) + Math.pow(candidate.y - existing.y, 2));
      if (distance < radius) {
        shouldKeep = false;
        break;
      }
    }
    
    if (shouldKeep) {
      kept.push(candidate);
    }
  }
  
  return kept;
}

function markStarRegion(mask: boolean[], width: number, height: number, 
                       centerX: number, centerY: number, size: number): void {
  const radius = Math.min(Math.ceil(Math.sqrt(size)), 3);
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if (dx * dx + dy * dy <= radius * radius) {
          mask[y * width + x] = true;
        }
      }
    }
  }
}

function calculateColorVariance(data: Uint8ClampedArray, width: number, height: number): number[] {
  const variance = new Array(width * height);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate variance in 3x3 neighborhood
      let rSum = 0, gSum = 0, bSum = 0;
      let count = 0;
      
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ni = ((y + dy) * width + (x + dx)) * 4;
          rSum += data[ni];
          gSum += data[ni + 1];
          bSum += data[ni + 2];
          count++;
        }
      }
      
      const rMean = rSum / count;
      const gMean = gSum / count;
      const bMean = bSum / count;
      
      const colorVar = Math.abs(r - rMean) + Math.abs(g - gMean) + Math.abs(b - bMean);
      variance[y * width + x] = colorVar;
    }
  }
  
  return variance;
}

function calculateTexture(data: Uint8ClampedArray, width: number, height: number): number[] {
  const texture = new Array(width * height);
  
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      // Calculate local standard deviation as texture measure
      let sum = 0, sumSq = 0, count = 0;
      
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const i = ((y + dy) * width + (x + dx)) * 4;
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          sum += lum;
          sumSq += lum * lum;
          count++;
        }
      }
      
      const mean = sum / count;
      const std = Math.sqrt(sumSq / count - mean * mean);
      texture[y * width + x] = std / 255; // Normalize
    }
  }
  
  return texture;
}

function calculateGradientMagnitude(data: Uint8ClampedArray, width: number, height: number): number[] {
  const gradient = new Array(width * height);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const curr = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      
      // Sobel operator
      const gx = (
        -1 * (0.299 * data[((y-1) * width + (x-1)) * 4] + 0.587 * data[((y-1) * width + (x-1)) * 4 + 1] + 0.114 * data[((y-1) * width + (x-1)) * 4 + 2]) +
         1 * (0.299 * data[((y-1) * width + (x+1)) * 4] + 0.587 * data[((y-1) * width + (x+1)) * 4 + 1] + 0.114 * data[((y-1) * width + (x+1)) * 4 + 2]) +
        -2 * (0.299 * data[(y * width + (x-1)) * 4] + 0.587 * data[(y * width + (x-1)) * 4 + 1] + 0.114 * data[(y * width + (x-1)) * 4 + 2]) +
         2 * (0.299 * data[(y * width + (x+1)) * 4] + 0.587 * data[(y * width + (x+1)) * 4 + 1] + 0.114 * data[(y * width + (x+1)) * 4 + 2]) +
        -1 * (0.299 * data[((y+1) * width + (x-1)) * 4] + 0.587 * data[((y+1) * width + (x-1)) * 4 + 1] + 0.114 * data[((y+1) * width + (x-1)) * 4 + 2]) +
         1 * (0.299 * data[((y+1) * width + (x+1)) * 4] + 0.587 * data[((y+1) * width + (x+1)) * 4 + 1] + 0.114 * data[((y+1) * width + (x+1)) * 4 + 2])
      );
      
      const gy = (
        -1 * (0.299 * data[((y-1) * width + (x-1)) * 4] + 0.587 * data[((y-1) * width + (x-1)) * 4 + 1] + 0.114 * data[((y-1) * width + (x-1)) * 4 + 2]) +
        -2 * (0.299 * data[((y-1) * width + x) * 4] + 0.587 * data[((y-1) * width + x) * 4 + 1] + 0.114 * data[((y-1) * width + x) * 4 + 2]) +
        -1 * (0.299 * data[((y-1) * width + (x+1)) * 4] + 0.587 * data[((y-1) * width + (x+1)) * 4 + 1] + 0.114 * data[((y-1) * width + (x+1)) * 4 + 2]) +
         1 * (0.299 * data[((y+1) * width + (x-1)) * 4] + 0.587 * data[((y+1) * width + (x-1)) * 4 + 1] + 0.114 * data[((y+1) * width + (x-1)) * 4 + 2]) +
         2 * (0.299 * data[((y+1) * width + x) * 4] + 0.587 * data[((y+1) * width + x) * 4 + 1] + 0.114 * data[((y+1) * width + x) * 4 + 2]) +
         1 * (0.299 * data[((y+1) * width + (x+1)) * 4] + 0.587 * data[((y+1) * width + (x+1)) * 4 + 1] + 0.114 * data[((y+1) * width + (x+1)) * 4 + 2])
      );
      
      gradient[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  
  return gradient;
}

function calculateEllipticity(data: Uint8ClampedArray, width: number, height: number): number[] {
  const ellipticity = new Array(width * height).fill(0);
  
  // Simplified ellipticity calculation using local gradients
  for (let y = 5; y < height - 5; y++) {
    for (let x = 5; x < width - 5; x++) {
      let m20 = 0, m02 = 0, m11 = 0, m00 = 0;
      
      // Calculate second moments in local region
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const i = ((y + dy) * width + (x + dx)) * 4;
          const intensity = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          
          m00 += intensity;
          m20 += dx * dx * intensity;
          m02 += dy * dy * intensity;
          m11 += dx * dy * intensity;
        }
      }
      
      if (m00 > 0) {
        m20 /= m00;
        m02 /= m00;
        m11 /= m00;
        
        const a = 0.5 * (m20 + m02);
        const b = Math.sqrt(4 * m11 * m11 + (m20 - m02) * (m20 - m02));
        const l1 = a + 0.5 * b;
        const l2 = a - 0.5 * b;
        
        if (l2 > 0) {
          ellipticity[y * width + x] = 1 - l2 / l1;
        }
      }
    }
  }
  
  return ellipticity;
}

function floodFillRegion(data: Uint8ClampedArray, width: number, height: number, startX: number, startY: number,
                        excludeMask: boolean[], visited: boolean[], 
                        predicate: (r: number, g: number, b: number, x: number, y: number) => boolean): 
                        { size: number; pixels: Array<[number, number]> } {
  const pixels: Array<[number, number]> = [];
  const stack = [[startX, startY]];
  
  while (stack.length > 0 && pixels.length < 10000) { // Prevent runaway
    const [x, y] = stack.pop()!;
    const idx = y * width + x;
    
    if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || excludeMask[idx]) {
      continue;
    }
    
    const i = idx * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    if (!predicate(r, g, b, x, y)) continue;
    
    visited[idx] = true;
    pixels.push([x, y]);
    
    // Add neighbors
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  
  return { size: pixels.length, pixels };
}

function calculateAspectRatio(pixels: Array<[number, number]>): number {
  if (pixels.length === 0) return 1;
  
  const xs = pixels.map(p => p[0]);
  const ys = pixels.map(p => p[1]);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  
  return Math.max(width, height) / Math.min(width, height);
}

function calculateCompactness(pixels: Array<[number, number]>, area: number): number {
  if (pixels.length === 0) return 0;
  
  // Calculate perimeter using boundary pixels
  const pixelSet = new Set(pixels.map(p => `${p[0]},${p[1]}`));
  let perimeter = 0;
  
  for (const [x, y] of pixels) {
    let neighborCount = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        if (pixelSet.has(`${x + dx},${y + dy}`)) {
          neighborCount++;
        }
      }
    }
    if (neighborCount < 8) perimeter++;
  }
  
  // Compactness = 4π * area / perimeter²
  return perimeter > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0;
}
