/**
 * Advanced star detection utilities for astronomy images
 * Implements sophisticated algorithms inspired by StarXTerminator
 */

export interface DetectedStar {
  x: number;
  y: number;
  brightness: number;
  size: number;
  color: { r: number; g: number; b: number };
  signal: number; // Signal-to-noise ratio
  confidence: number; // Detection confidence (0-1)
  type: 'point' | 'extended' | 'saturated'; // Star classification
}

export interface StarDetectionSettings {
  threshold: number; // Brightness threshold (0-255)
  minStarSize: number; // Minimum star size in pixels
  maxStarSize: number; // Maximum star size in pixels
  sigma: number; // Gaussian blur sigma for noise reduction
  sensitivity: number; // Detection sensitivity (0-1)
}

const DEFAULT_SETTINGS: StarDetectionSettings = {
  threshold: 8, // Lower threshold for faint stars
  minStarSize: 0.5,
  maxStarSize: 50,
  sigma: 0.5, // Minimal noise reduction to preserve star details
  sensitivity: 0.6 // High sensitivity detection
};

/**
 * Gaussian blur kernel generation
 */
function generateGaussianKernel(sigma: number): { kernel: number[][], size: number } {
  const size = Math.ceil(sigma * 6) | 1; // Ensure odd size
  const kernel: number[][] = [];
  const center = Math.floor(size / 2);
  let sum = 0;

  for (let y = 0; y < size; y++) {
    kernel[y] = [];
    for (let x = 0; x < size; x++) {
      const distance = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      const value = Math.exp(-(distance ** 2) / (2 * sigma ** 2));
      kernel[y][x] = value;
      sum += value;
    }
  }

  // Normalize kernel
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      kernel[y][x] /= sum;
    }
  }

  return { kernel, size };
}

/**
 * Apply Gaussian blur to reduce noise
 */
function applyGaussianBlur(
  imageData: ImageData, 
  sigma: number
): ImageData {
  const { data, width, height } = imageData;
  const { kernel, size } = generateGaussianKernel(sigma);
  const blurred = new ImageData(width, height);
  const center = Math.floor(size / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;

      for (let ky = 0; ky < size; ky++) {
        for (let kx = 0; kx < size; kx++) {
          const py = y + ky - center;
          const px = x + kx - center;

          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) * 4;
            const weight = kernel[ky][kx];
            
            r += data[idx] * weight;
            g += data[idx + 1] * weight;
            b += data[idx + 2] * weight;
            a += data[idx + 3] * weight;
          }
        }
      }

      const idx = (y * width + x) * 4;
      blurred.data[idx] = Math.round(r);
      blurred.data[idx + 1] = Math.round(g);
      blurred.data[idx + 2] = Math.round(b);
      blurred.data[idx + 3] = Math.round(a);
    }
  }

  return blurred;
}

/**
 * Convert RGB to grayscale luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Multi-scale star detection using morphological operations
 * Inspired by StarXTerminator's approach
 */
function detectStarsMultiScale(
  imageData: ImageData,
  settings: StarDetectionSettings
): Array<{ x: number; y: number; value: number; color: { r: number; g: number; b: number }; confidence: number; type: 'point' | 'extended' | 'saturated' }> {
  const { data, width, height } = imageData;
  const stars: Array<{ x: number; y: number; value: number; color: { r: number; g: number; b: number }; confidence: number; type: 'point' | 'extended' | 'saturated' }> = [];

  // Calculate background statistics
  const backgroundStats = calculateBackgroundStatistics(imageData);
  const dynamicThreshold = backgroundStats.median + (backgroundStats.mad * 5); // 5-sigma detection

  console.log(`Background: median=${backgroundStats.median.toFixed(2)}, MAD=${backgroundStats.mad.toFixed(2)}, threshold=${dynamicThreshold.toFixed(2)}`);

  // Multi-scale detection with different kernel sizes
  const scales = [1, 2, 3, 5]; // Different star sizes to detect
  
  for (const scale of scales) {
    const detectedAtScale = detectStarsAtScale(imageData, scale, dynamicThreshold, settings);
    stars.push(...detectedAtScale);
  }

  // Remove duplicates and merge nearby detections
  return mergeDuplicateDetections(stars, 3);
}

/**
 * Calculate robust background statistics using median and MAD
 */
function calculateBackgroundStatistics(imageData: ImageData): { median: number; mad: number; mean: number } {
  const { data } = imageData;
  const values: number[] = [];

  // Sample every 4th pixel to speed up computation
  for (let i = 0; i < data.length; i += 16) {
    const luminance = getLuminance(data[i], data[i + 1], data[i + 2]);
    values.push(luminance);
  }

  values.sort((a, b) => a - b);
  
  const median = values[Math.floor(values.length / 2)];
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Calculate Median Absolute Deviation (MAD)
  const deviations = values.map(val => Math.abs(val - median));
  deviations.sort((a, b) => a - b);
  const mad = deviations[Math.floor(deviations.length / 2)] * 1.4826; // Scale factor for normal distribution

  return { median, mad, mean };
}

/**
 * Detect stars at a specific scale using morphological operations
 */
function detectStarsAtScale(
  imageData: ImageData, 
  scale: number, 
  threshold: number,
  settings: StarDetectionSettings
): Array<{ x: number; y: number; value: number; color: { r: number; g: number; b: number }; confidence: number; type: 'point' | 'extended' | 'saturated' }> {
  const { data, width, height } = imageData;
  const stars: Array<{ x: number; y: number; value: number; color: { r: number; g: number; b: number }; confidence: number; type: 'point' | 'extended' | 'saturated' }> = [];
  
  // Create morphological kernel
  const kernel = createCircularKernel(scale);
  
  // Apply top-hat transform to enhance point sources
  const topHat = morphologicalTopHat(imageData, kernel);
  
  // Find local maxima in the enhanced image
  const stepSize = Math.max(1, Math.floor(scale / 2));
  
  for (let y = scale * 2; y < height - scale * 2; y += stepSize) {
    for (let x = scale * 2; x < width - scale * 2; x += stepSize) {
      const idx = (y * width + x) * 4;
      const luminance = getLuminance(topHat[idx], topHat[idx + 1], topHat[idx + 2]);
      
      if (luminance < threshold) continue;
      
      // Check if this is a local maximum
      if (isLocalMaximum(topHat, width, height, x, y, scale * 2)) {
        const originalIdx = (y * width + x) * 4;
        const originalColor = {
          r: data[originalIdx],
          g: data[originalIdx + 1],
          b: data[originalIdx + 2]
        };
        
        // Calculate confidence based on peak sharpness and contrast
        const confidence = calculateStarConfidence(imageData, x, y, scale, threshold);
        
        // Classify star type
        const starType = classifyStar(imageData, x, y, scale, luminance);
        
        if (confidence > 0.3) { // Minimum confidence threshold
          stars.push({
            x,
            y,
            value: luminance,
            color: originalColor,
            confidence,
            type: starType
          });
        }
      }
    }
  }
  
  return stars;
}

/**
 * Create circular morphological kernel
 */
function createCircularKernel(radius: number): boolean[][] {
  const size = radius * 2 + 1;
  const kernel: boolean[][] = [];
  const center = radius;
  
  for (let y = 0; y < size; y++) {
    kernel[y] = [];
    for (let x = 0; x < size; x++) {
      const distance = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      kernel[y][x] = distance <= radius;
    }
  }
  
  return kernel;
}

/**
 * Morphological top-hat transform to enhance point sources
 */
function morphologicalTopHat(imageData: ImageData, kernel: boolean[][]): Uint8ClampedArray {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);
  const opened = morphologicalOpening(imageData, kernel);
  
  // Top-hat = original - opening
  for (let i = 0; i < data.length; i += 4) {
    result[i] = Math.max(0, data[i] - opened[i]); // R
    result[i + 1] = Math.max(0, data[i + 1] - opened[i + 1]); // G
    result[i + 2] = Math.max(0, data[i + 2] - opened[i + 2]); // B
    result[i + 3] = data[i + 3]; // A
  }
  
  return result;
}

/**
 * Morphological opening (erosion followed by dilation)
 */
function morphologicalOpening(imageData: ImageData, kernel: boolean[][]): Uint8ClampedArray {
  const eroded = morphologicalErosion(imageData, kernel);
  const erodedImageData = new ImageData(new Uint8ClampedArray(eroded), imageData.width, imageData.height);
  return morphologicalDilation(erodedImageData, kernel);
}

/**
 * Morphological erosion
 */
function morphologicalErosion(imageData: ImageData, kernel: boolean[][]): Uint8ClampedArray {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);
  const kernelRadius = Math.floor(kernel.length / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let minR = 255, minG = 255, minB = 255;
      
      for (let ky = 0; ky < kernel.length; ky++) {
        for (let kx = 0; kx < kernel[0].length; kx++) {
          if (!kernel[ky][kx]) continue;
          
          const ny = y + ky - kernelRadius;
          const nx = x + kx - kernelRadius;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = (ny * width + nx) * 4;
            minR = Math.min(minR, data[nIdx]);
            minG = Math.min(minG, data[nIdx + 1]);
            minB = Math.min(minB, data[nIdx + 2]);
          }
        }
      }
      
      result[idx] = minR;
      result[idx + 1] = minG;
      result[idx + 2] = minB;
      result[idx + 3] = data[idx + 3];
    }
  }
  
  return result;
}

/**
 * Morphological dilation
 */
function morphologicalDilation(imageData: ImageData, kernel: boolean[][]): Uint8ClampedArray {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);
  const kernelRadius = Math.floor(kernel.length / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let maxR = 0, maxG = 0, maxB = 0;
      
      for (let ky = 0; ky < kernel.length; ky++) {
        for (let kx = 0; kx < kernel[0].length; kx++) {
          if (!kernel[ky][kx]) continue;
          
          const ny = y + ky - kernelRadius;
          const nx = x + kx - kernelRadius;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = (ny * width + nx) * 4;
            maxR = Math.max(maxR, data[nIdx]);
            maxG = Math.max(maxG, data[nIdx + 1]);
            maxB = Math.max(maxB, data[nIdx + 2]);
          }
        }
      }
      
      result[idx] = maxR;
      result[idx + 1] = maxG;
      result[idx + 2] = maxB;
      result[idx + 3] = data[idx + 3];
    }
  }
  
  return result;
}

/**
 * Check if point is local maximum
 */
function isLocalMaximum(data: Uint8ClampedArray, width: number, height: number, x: number, y: number, radius: number): boolean {
  const centerIdx = (y * width + x) * 4;
  const centerValue = getLuminance(data[centerIdx], data[centerIdx + 1], data[centerIdx + 2]);
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = (ny * width + nx) * 4;
        const nValue = getLuminance(data[nIdx], data[nIdx + 1], data[nIdx + 2]);
        
        if (nValue >= centerValue) {
          return false;
        }
      }
    }
  }
  
  return true;
}

/**
 * Calculate star detection confidence
 */
function calculateStarConfidence(imageData: ImageData, x: number, y: number, scale: number, threshold: number): number {
  const { data, width, height } = imageData;
  const centerIdx = (y * width + x) * 4;
  const centerValue = getLuminance(data[centerIdx], data[centerIdx + 1], data[centerIdx + 2]);
  
  // Calculate radial profile to assess star-like characteristics
  const radialProfile: number[] = [];
  const maxRadius = scale * 3;
  
  for (let r = 1; r <= maxRadius; r++) {
    let sum = 0;
    let count = 0;
    
    // Sample points at this radius
    const circumference = Math.max(8, Math.floor(2 * Math.PI * r));
    for (let i = 0; i < circumference; i++) {
      const angle = (2 * Math.PI * i) / circumference;
      const px = Math.round(x + Math.cos(angle) * r);
      const py = Math.round(y + Math.sin(angle) * r);
      
      if (px >= 0 && px < width && py >= 0 && py < height) {
        const idx = (py * width + px) * 4;
        sum += getLuminance(data[idx], data[idx + 1], data[idx + 2]);
        count++;
      }
    }
    
    if (count > 0) {
      radialProfile.push(sum / count);
    }
  }
  
  // Calculate confidence based on how well the profile matches a star
  let confidence = 0;
  
  // Peak-to-background ratio
  const background = radialProfile[radialProfile.length - 1] || 0;
  const peakRatio = background > 0 ? centerValue / background : centerValue / 10;
  confidence += Math.min(1, peakRatio / 10) * 0.4;
  
  // Radial decay (should decrease with distance)
  let decayScore = 0;
  for (let i = 1; i < radialProfile.length; i++) {
    if (radialProfile[i] <= radialProfile[i - 1]) {
      decayScore++;
    }
  }
  confidence += (decayScore / Math.max(1, radialProfile.length - 1)) * 0.3;
  
  // Signal strength
  const signalStrength = Math.min(1, centerValue / 255);
  confidence += signalStrength * 0.3;
  
  return Math.min(1, confidence);
}

/**
 * Classify star type based on characteristics with improved saturated star detection
 */
function classifyStar(imageData: ImageData, x: number, y: number, scale: number, luminance: number): 'point' | 'extended' | 'saturated' {
  const { data, width, height } = imageData;
  
  // Check for saturation in a wider region to catch bright halos
  const checkRadius = Math.max(5, scale * 2);
  let saturatedPixels = 0;
  let totalChecked = 0;
  
  for (let dy = -checkRadius; dy <= checkRadius; dy++) {
    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
      const px = x + dx;
      const py = y + dy;
      if (px >= 0 && px < width && py >= 0 && py < height) {
        const idx = (py * width + px) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Check if any channel is saturated or near-saturated
        if (r >= 240 || g >= 240 || b >= 240) {
          saturatedPixels++;
        }
        totalChecked++;
      }
    }
  }
  
  // If more than 5% of nearby pixels are saturated, it's a saturated star
  if (saturatedPixels / totalChecked > 0.05) {
    return 'saturated';
  }
  
  if (luminance >= 250) {
    return 'saturated';
  }
  
  const measuredSize = calculateStarSize(imageData, x, y, scale * 2);
  
  if (measuredSize < 2) {
    return 'point';
  } else {
    return 'extended';
  }
}

/**
 * Merge duplicate detections from multiple scales
 */
function mergeDuplicateDetections(
  stars: Array<{ x: number; y: number; value: number; color: { r: number; g: number; b: number }; confidence: number; type: 'point' | 'extended' | 'saturated' }>,
  mergeRadius: number
): Array<{ x: number; y: number; value: number; color: { r: number; g: number; b: number }; confidence: number; type: 'point' | 'extended' | 'saturated' }> {
  const merged: Array<{ x: number; y: number; value: number; color: { r: number; g: number; b: number }; confidence: number; type: 'point' | 'extended' | 'saturated' }> = [];
  const used = new Set<number>();
  
  for (let i = 0; i < stars.length; i++) {
    if (used.has(i)) continue;
    
    const star = stars[i];
    const cluster = [star];
    used.add(i);
    
    // Find nearby stars to merge
    for (let j = i + 1; j < stars.length; j++) {
      if (used.has(j)) continue;
      
      const other = stars[j];
      const distance = Math.sqrt((star.x - other.x) ** 2 + (star.y - other.y) ** 2);
      
      if (distance <= mergeRadius) {
        cluster.push(other);
        used.add(j);
      }
    }
    
    // Create merged star (use highest confidence detection)
    const best = cluster.reduce((prev, curr) => curr.confidence > prev.confidence ? curr : prev);
    merged.push(best);
  }
  
  return merged;
}

/**
 * Calculate star size using moment analysis
 */
function calculateStarSize(
  imageData: ImageData,
  centerX: number,
  centerY: number,
  maxRadius: number
): number {
  const { data, width, height } = imageData;
  let totalWeight = 0;
  let weightedSum = 0;

  for (let dy = -maxRadius; dy <= maxRadius; dy++) {
    for (let dx = -maxRadius; dx <= maxRadius; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;

      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        const luminance = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (luminance > 10) { // Only consider bright pixels
          totalWeight += luminance;
          weightedSum += luminance * distance;
        }
      }
    }
  }

  return totalWeight > 0 ? (weightedSum / totalWeight) * 2 : 1;
}

/**
 * Convert detected stars to final format with enhanced properties
 */
function processDetectedStars(
  stars: Array<{ x: number; y: number; value: number; color: { r: number; g: number; b: number }; confidence: number; type: 'point' | 'extended' | 'saturated' }>,
  imageData: ImageData,
  settings: StarDetectionSettings
): DetectedStar[] {
  const validStars: DetectedStar[] = [];

  console.log(`Processing ${stars.length} detected stars...`);

  for (const star of stars) {
    // Calculate precise star size
    const size = calculatePreciseStarSize(imageData, star.x, star.y, star.type);
    
    // Skip if size is out of reasonable bounds
    if (size < settings.minStarSize || size > settings.maxStarSize) continue;

    // Calculate signal-to-noise ratio
    const signal = star.value;
    const noise = calculateLocalNoise(imageData, star.x, star.y, Math.max(3, size * 2));
    const snr = noise > 0 ? signal / noise : signal / 5;

    // Filter by confidence and SNR
    if (star.confidence < 0.3 || snr < 2.0) continue;

    // Calculate final brightness with better scaling
    const brightness = Math.max(0.05, Math.min(1.0, star.value / 255));
    
    // Adjust size based on star type and brightness
    let finalSize = size;
    switch (star.type) {
      case 'point':
        finalSize = Math.max(0.5, Math.min(3, size + brightness * 2));
        break;
      case 'extended':
        finalSize = Math.max(2, Math.min(8, size + brightness * 3));
        break;
      case 'saturated':
        finalSize = Math.max(4, Math.min(12, size + brightness * 4));
        break;
    }

    validStars.push({
      x: star.x,
      y: star.y,
      brightness,
      size: finalSize,
      color: star.color,
      signal: snr,
      confidence: star.confidence,
      type: star.type
    });
  }

  console.log(`Found ${validStars.length} valid stars after processing`);

  // Sort by confidence and brightness, then limit results
  return validStars
    .sort((a, b) => (b.confidence * b.brightness) - (a.confidence * a.brightness))
    .slice(0, 3000); // Reasonable limit for performance
}

/**
 * Calculate precise star size based on type
 */
function calculatePreciseStarSize(
  imageData: ImageData,
  centerX: number,
  centerY: number,
  type: 'point' | 'extended' | 'saturated'
): number {
  const { data, width, height } = imageData;
  const centerIdx = (centerY * width + centerX) * 4;
  const centerValue = getLuminance(data[centerIdx], data[centerIdx + 1], data[centerIdx + 2]);
  
  // Different size calculation based on star type
  const maxRadius = type === 'point' ? 5 : type === 'extended' ? 10 : 15;
  const threshold = centerValue * 0.1; // 10% of peak brightness
  
  let effectiveRadius = 0.5;
  
  // Measure radius where brightness drops below threshold
  for (let r = 1; r <= maxRadius; r++) {
    let averageBrightness = 0;
    let count = 0;
    
    // Sample points at this radius
    const samples = Math.max(8, Math.floor(2 * Math.PI * r));
    for (let i = 0; i < samples; i++) {
      const angle = (2 * Math.PI * i) / samples;
      const x = Math.round(centerX + Math.cos(angle) * r);
      const y = Math.round(centerY + Math.sin(angle) * r);
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        averageBrightness += getLuminance(data[idx], data[idx + 1], data[idx + 2]);
        count++;
      }
    }
    
    if (count > 0) {
      averageBrightness /= count;
      if (averageBrightness >= threshold) {
        effectiveRadius = r;
      } else {
        break;
      }
    }
  }
  
  return Math.max(0.5, effectiveRadius);
}

/**
 * Calculate local noise level around a point
 */
function calculateLocalNoise(
  imageData: ImageData,
  centerX: number,
  centerY: number,
  radius: number
): number {
  const { data, width, height } = imageData;
  const values: number[] = [];

  // Sample points in an annulus around the star
  const innerRadius = radius;
  const outerRadius = radius * 2;

  for (let angle = 0; angle < Math.PI * 2; angle += 0.5) {
    for (let r = innerRadius; r <= outerRadius; r += 2) {
      const x = Math.round(centerX + Math.cos(angle) * r);
      const y = Math.round(centerY + Math.sin(angle) * r);

      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        const luminance = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
        values.push(luminance);
      }
    }
  }

  if (values.length === 0) return 1;

  // Calculate standard deviation as noise estimate
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Main star detection function with advanced multi-scale approach
 */
export async function detectStarsFromImage(
  imageElement: HTMLImageElement,
  settings: StarDetectionSettings = DEFAULT_SETTINGS
): Promise<DetectedStar[]> {
  return new Promise((resolve, reject) => {
    try {
      console.log('Starting advanced star detection...');
      
      // Create canvas and draw image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      ctx.drawImage(imageElement, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      console.log(`Processing image: ${canvas.width}x${canvas.height}`);

      // Apply minimal Gaussian blur to reduce noise while preserving star details
      const blurredData = applyGaussianBlur(imageData, settings.sigma);

      // Multi-scale star detection using morphological operations
      const rawDetections = detectStarsMultiScale(blurredData, settings);
      console.log(`Multi-scale detection found ${rawDetections.length} candidates`);

      // Process and filter detections
      const detectedStars = processDetectedStars(rawDetections, imageData, settings);

      console.log(`Final result: ${detectedStars.length} high-quality stars detected`);
      
      resolve(detectedStars);
    } catch (error) {
      console.error('Star detection error:', error);
      reject(error);
    }
  });
}

/**
 * Create separated star and nebula images using advanced techniques
 */
export async function separateStarsAndNebula(
  imageElement: HTMLImageElement,
  detectedStars: DetectedStar[]
): Promise<{ starImage: string; nebulaImage: string }> {
  return new Promise((resolve, reject) => {
    try {
      console.log('Starting advanced star-nebula separation...');
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;

      // Create precise star mask
      const starMask = createPreciseStarMask(canvas.width, canvas.height, detectedStars);
      
      // Generate star-only image with realistic appearance
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Render stars with proper PSF (Point Spread Function)
      for (const star of detectedStars) {
        renderStarWithPSF(ctx, star);
      }
      
      const starImage = canvas.toDataURL('image/png');

      // Create nebula image using sophisticated star removal
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageElement, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const nebulaData = removeStarsFromImage(imageData, detectedStars, starMask);
      
      ctx.putImageData(nebulaData, 0, 0);
      const nebulaImage = canvas.toDataURL('image/png');

      console.log('Star-nebula separation completed');
      resolve({ starImage, nebulaImage });
    } catch (error) {
      console.error('Separation error:', error);
      reject(error);
    }
  });
}

/**
 * Create precise star mask for better separation with enhanced Gaussian feathering for bright stars
 */
function createPreciseStarMask(width: number, height: number, stars: DetectedStar[]): Float32Array {
  const mask = new Float32Array(width * height);
  
  for (const star of stars) {
    // Adaptive radius based on star type and brightness
    let radiusMultiplier = 5;
    if (star.type === 'saturated') {
      radiusMultiplier = 8; // Much larger for saturated stars with halos
    } else if (star.type === 'extended') {
      radiusMultiplier = 6.5;
    }
    
    const radius = Math.max(8, star.size * radiusMultiplier);
    const centerX = Math.round(star.x);
    const centerY = Math.round(star.y);
    
    // More aggressive feathering for bright stars
    const sigma = star.type === 'saturated' ? radius / 2.5 : radius / 3;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Multi-layer Gaussian for better feathering on bright stars
          let maskValue;
          if (star.type === 'saturated' && distance < radius * 0.4) {
            // Core region: strong mask
            maskValue = Math.exp(-(distance * distance) / (2 * (sigma * 0.5) * (sigma * 0.5))) * star.confidence;
          } else {
            // Outer region: gentle falloff
            const gaussianFalloff = Math.exp(-(distance * distance) / (2 * sigma * sigma));
            maskValue = gaussianFalloff * star.confidence * 0.9;
          }
          
          const idx = y * width + x;
          
          // Use maximum mask value for overlapping stars
          mask[idx] = Math.max(mask[idx], maskValue);
        }
      }
    }
  }
  
  return mask;
}

/**
 * Render star with realistic Point Spread Function with enhanced feathering for all star types
 */
function renderStarWithPSF(ctx: CanvasRenderingContext2D, star: DetectedStar) {
  const { x, y, size, color, brightness, type } = star;
  
  // Create realistic star appearance with extended halos and smoother transitions
  let coreSize = size;
  let innerHaloSize = size * 2;
  let midSize = size * 4;
  let outerHaloSize = size * 7; // Extended outer halo
  
  switch (type) {
    case 'point':
      coreSize = Math.max(0.5, size * 0.8);
      innerHaloSize = size * 2;
      midSize = size * 4;
      outerHaloSize = size * 6;
      break;
    case 'extended':
      coreSize = size;
      innerHaloSize = size * 3;
      midSize = size * 5.5;
      outerHaloSize = size * 9;
      break;
    case 'saturated':
      coreSize = size * 1.3;
      innerHaloSize = size * 4;
      midSize = size * 7;
      outerHaloSize = size * 12; // Very large for bright stars
      break;
  }
  
  const { r, g, b } = color;
  
  // Four-layer gradient system for ultra-smooth feathering
  
  // Far outer halo (barely visible glow)
  const farHaloGradient = ctx.createRadialGradient(x, y, midSize * 0.7, x, y, outerHaloSize);
  farHaloGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness * 0.06})`);
  farHaloGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${brightness * 0.03})`);
  farHaloGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${brightness * 0.01})`);
  farHaloGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = farHaloGradient;
  ctx.fillRect(x - outerHaloSize, y - outerHaloSize, outerHaloSize * 2, outerHaloSize * 2);
  
  // Outer halo with gentle transition
  const outerHaloGradient = ctx.createRadialGradient(x, y, innerHaloSize, x, y, midSize);
  outerHaloGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness * 0.18})`);
  outerHaloGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${brightness * 0.12})`);
  outerHaloGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${brightness * 0.07})`);
  outerHaloGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${brightness * 0.03})`);
  
  ctx.fillStyle = outerHaloGradient;
  ctx.fillRect(x - midSize, y - midSize, midSize * 2, midSize * 2);
  
  // Mid halo for smooth transition to core
  const midHaloGradient = ctx.createRadialGradient(x, y, coreSize, x, y, innerHaloSize);
  midHaloGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness * 0.45})`);
  midHaloGradient.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${brightness * 0.32})`);
  midHaloGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${brightness * 0.22})`);
  midHaloGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${brightness * 0.15})`);
  
  ctx.fillStyle = midHaloGradient;
  ctx.fillRect(x - innerHaloSize, y - innerHaloSize, innerHaloSize * 2, innerHaloSize * 2);
  
  // Core brightness with soft edges (on top)
  const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, coreSize);
  coreGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness})`);
  coreGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${brightness * 0.9})`);
  coreGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${brightness * 0.7})`);
  coreGradient.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, ${brightness * 0.5})`);
  coreGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${brightness * 0.35})`);
  
  ctx.fillStyle = coreGradient;
  ctx.fillRect(x - coreSize, y - coreSize, coreSize * 2, coreSize * 2);
  
  // Diffraction spikes for bright stars
  if (brightness > 0.7 && type !== 'point') {
    renderDiffractionSpikes(ctx, star);
  }
}

/**
 * Render diffraction spikes for bright stars
 */
function renderDiffractionSpikes(ctx: CanvasRenderingContext2D, star: DetectedStar) {
  const { x, y, size, color, brightness } = star;
  const spikeLength = size * 8;
  const spikeWidth = Math.max(1, size * 0.3);
  
  ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${brightness * 0.4})`;
  ctx.lineWidth = spikeWidth;
  ctx.lineCap = 'round';
  
  // Vertical spike
  ctx.beginPath();
  ctx.moveTo(x, y - spikeLength);
  ctx.lineTo(x, y + spikeLength);
  ctx.stroke();
  
  // Horizontal spike
  ctx.beginPath();
  ctx.moveTo(x - spikeLength, y);
  ctx.lineTo(x + spikeLength, y);
  ctx.stroke();
}

/**
 * Remove stars from image using sophisticated inpainting
 */
function removeStarsFromImage(imageData: ImageData, stars: DetectedStar[], mask: Float32Array): ImageData {
  const { data, width, height } = imageData;
  const result = new ImageData(new Uint8ClampedArray(data), width, height);
  const resultData = result.data;
  
  // For each star, perform local background estimation and inpainting
  for (const star of stars) {
    const radius = Math.max(5, star.size * 5);
    const centerX = Math.round(star.x);
    const centerY = Math.round(star.y);
    
    // Estimate local background
    const background = estimateLocalBackground(imageData, centerX, centerY, radius * 2, radius * 3);
    
    // Apply inpainting within star region
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance <= radius) {
            const idx = (y * width + x) * 4;
            const maskIdx = y * width + x;
            const maskValue = mask[maskIdx];
            
            if (maskValue > 0.1) {
              // Blend with background based on mask strength
              const blendFactor = Math.min(1, maskValue);
              
              resultData[idx] = lerp(data[idx], background.r, blendFactor);
              resultData[idx + 1] = lerp(data[idx + 1], background.g, blendFactor);
              resultData[idx + 2] = lerp(data[idx + 2], background.b, blendFactor);
            }
          }
        }
      }
    }
  }
  
  return result;
}

/**
 * Estimate local background color around a point
 */
function estimateLocalBackground(
  imageData: ImageData, 
  centerX: number, 
  centerY: number, 
  innerRadius: number, 
  outerRadius: number
): { r: number; g: number; b: number } {
  const { data, width, height } = imageData;
  const samples: { r: number; g: number; b: number }[] = [];
  
  // Sample points in annulus between inner and outer radius
  for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
    for (let r = innerRadius; r <= outerRadius; r += 2) {
      const x = Math.round(centerX + Math.cos(angle) * r);
      const y = Math.round(centerY + Math.sin(angle) * r);
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        samples.push({
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2]
        });
      }
    }
  }
  
  if (samples.length === 0) {
    return { r: 0, g: 0, b: 0 };
  }
  
  // Use median for robust background estimation
  samples.sort((a, b) => getLuminance(a.r, a.g, a.b) - getLuminance(b.r, b.g, b.b));
  const medianIdx = Math.floor(samples.length / 2);
  
  return samples[medianIdx];
}

/**
 * Linear interpolation helper
 */
function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}
