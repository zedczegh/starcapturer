/**
 * Advanced star detection utilities for astronomy images
 * Implements algorithms similar to StarNet and StarXTerminator
 */

export interface DetectedStar {
  x: number;
  y: number;
  brightness: number;
  size: number;
  color: { r: number; g: number; b: number };
  signal: number; // Signal-to-noise ratio
}

export interface StarDetectionSettings {
  threshold: number; // Brightness threshold (0-255)
  minStarSize: number; // Minimum star size in pixels
  maxStarSize: number; // Maximum star size in pixels
  sigma: number; // Gaussian blur sigma for noise reduction
  sensitivity: number; // Detection sensitivity (0-1)
}

const DEFAULT_SETTINGS: StarDetectionSettings = {
  threshold: 50,
  minStarSize: 2,
  maxStarSize: 20,
  sigma: 1.5,
  sensitivity: 0.7
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
 * Find local maxima (potential stars)
 */
function findLocalMaxima(
  imageData: ImageData,
  threshold: number,
  minSize: number,
  maxSize: number
): Array<{ x: number; y: number; value: number; color: { r: number; g: number; b: number } }> {
  const { data, width, height } = imageData;
  const maxima: Array<{ x: number; y: number; value: number; color: { r: number; g: number; b: number } }> = [];

  for (let y = minSize; y < height - minSize; y++) {
    for (let x = minSize; x < width - minSize; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const luminance = getLuminance(r, g, b);

      if (luminance < threshold) continue;

      // Check if this is a local maximum
      let isMaximum = true;
      const checkRadius = Math.min(maxSize, 5);

      for (let dy = -checkRadius; dy <= checkRadius && isMaximum; dy++) {
        for (let dx = -checkRadius; dx <= checkRadius && isMaximum; dx++) {
          if (dx === 0 && dy === 0) continue;

          const ny = y + dy;
          const nx = x + dx;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = (ny * width + nx) * 4;
            const nLuminance = getLuminance(data[nIdx], data[nIdx + 1], data[nIdx + 2]);
            
            if (nLuminance > luminance) {
              isMaximum = false;
            }
          }
        }
      }

      if (isMaximum) {
        maxima.push({
          x,
          y,
          value: luminance,
          color: { r, g, b }
        });
      }
    }
  }

  return maxima;
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
 * Filter stars by quality metrics
 */
function filterStarQuality(
  stars: Array<{ x: number; y: number; value: number; color: { r: number; g: number; b: number } }>,
  imageData: ImageData,
  settings: StarDetectionSettings
): DetectedStar[] {
  const validStars: DetectedStar[] = [];

  for (const star of stars) {
    const size = calculateStarSize(imageData, star.x, star.y, settings.maxStarSize);
    
    // Filter by size constraints
    if (size < settings.minStarSize || size > settings.maxStarSize) continue;

    // Calculate signal-to-noise ratio
    const signal = star.value;
    const noise = calculateLocalNoise(imageData, star.x, star.y, size * 2);
    const snr = noise > 0 ? signal / noise : signal;

    // Filter by signal-to-noise ratio
    if (snr < (settings.sensitivity * 10)) continue;

    validStars.push({
      x: star.x,
      y: star.y,
      brightness: star.value / 255,
      size: Math.max(1, size / 2),
      color: star.color,
      signal: snr
    });
  }

  // Sort by brightness (keep the brightest stars)
  return validStars
    .sort((a, b) => b.brightness - a.brightness)
    .slice(0, 2000); // Limit to 2000 brightest stars
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
 * Main star detection function
 */
export async function detectStarsFromImage(
  imageElement: HTMLImageElement,
  settings: StarDetectionSettings = DEFAULT_SETTINGS
): Promise<DetectedStar[]> {
  return new Promise((resolve, reject) => {
    try {
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

      // Apply Gaussian blur to reduce noise
      const blurredData = applyGaussianBlur(imageData, settings.sigma);

      // Find local maxima (potential stars)
      const maxima = findLocalMaxima(
        blurredData,
        settings.threshold,
        settings.minStarSize,
        settings.maxStarSize
      );

      // Filter and validate stars
      const detectedStars = filterStarQuality(maxima, imageData, settings);

      console.log(`Detected ${detectedStars.length} stars from ${maxima.length} candidates`);
      
      resolve(detectedStars);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Create separated star and nebula images
 */
export async function separateStarsAndNebula(
  imageElement: HTMLImageElement,
  detectedStars: DetectedStar[]
): Promise<{ starImage: string; nebulaImage: string }> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;

      // Create star-only image
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw detected stars
      for (const star of detectedStars) {
        const gradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 2
        );
        
        const { r, g, b } = star.color;
        gradient.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
          star.x - star.size * 2,
          star.y - star.size * 2,
          star.size * 4,
          star.size * 4
        );
      }
      
      const starImage = canvas.toDataURL('image/png');

      // Create nebula image (original with stars subtracted)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageElement, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Subtract stars from original image
      for (const star of detectedStars) {
        const radius = star.size * 3;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const x = Math.round(star.x + dx);
            const y = Math.round(star.y + dy);
            
            if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance <= radius) {
                const idx = (y * canvas.width + x) * 4;
                const falloff = Math.max(0, 1 - (distance / radius));
                
                // Reduce brightness based on star intensity and distance
                const reduction = star.brightness * falloff * 0.8;
                
                data[idx] = Math.max(0, data[idx] - data[idx] * reduction);
                data[idx + 1] = Math.max(0, data[idx + 1] - data[idx + 1] * reduction);
                data[idx + 2] = Math.max(0, data[idx + 2] - data[idx + 2] * reduction);
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const nebulaImage = canvas.toDataURL('image/png');

      resolve({ starImage, nebulaImage });
    } catch (error) {
      reject(error);
    }
  });
}
