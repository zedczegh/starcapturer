/**
 * Simple and fast star detection algorithm for browser use
 * Uses basic brightness thresholding with local maximum detection
 * Much faster than morphological operations
 */

interface SimpleStar {
  x: number;
  y: number;
  brightness: number;
  size: number;
  color: { r: number; g: number; b: number };
}

export interface SimpleStarDetectionSettings {
  threshold: number; // 0-1 normalized threshold
  sensitivity: number; // Multiplier for detection
  minStarSize: number;
  maxStarSize: number;
}

/**
 * Get luminance from RGB values
 */
function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Yield control to prevent UI freezing
 */
async function yieldToMain(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Fast star detection using brightness thresholding
 */
export async function detectStarsSimple(
  imageElement: HTMLImageElement,
  settings: SimpleStarDetectionSettings,
  onProgress?: (progress: number, stage: string) => void
): Promise<SimpleStar[]> {
  onProgress?.(0, 'Initializing...');
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');
  
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  ctx.drawImage(imageElement, 0, 0);
  
  onProgress?.(10, 'Reading image data...');
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  
  onProgress?.(20, 'Analyzing image brightness...');
  
  // Calculate brightness statistics
  const luminanceValues: number[] = [];
  for (let i = 0; i < data.length; i += 40) { // Sample every 10th pixel
    luminanceValues.push(getLuminance(data[i], data[i + 1], data[i + 2]));
  }
  
  luminanceValues.sort((a, b) => a - b);
  const median = luminanceValues[Math.floor(luminanceValues.length / 2)];
  const p90 = luminanceValues[Math.floor(luminanceValues.length * 0.9)];
  
  // Calculate detection threshold
  const range = p90 - median;
  const baseThreshold = median + (range * (1 - settings.threshold));
  const detectionThreshold = baseThreshold * settings.sensitivity;
  
  console.log(`Detection threshold: ${detectionThreshold.toFixed(2)} (median: ${median.toFixed(2)}, p90: ${p90.toFixed(2)})`);
  
  onProgress?.(30, 'Finding bright pixels...');
  
  // Find candidate bright pixels
  const candidates: { x: number; y: number; value: number }[] = [];
  const step = 2; // Check every 2nd pixel for speed
  
  let processedRows = 0;
  for (let y = 10; y < height - 10; y += step) {
    for (let x = 10; x < width - 10; x += step) {
      const idx = (y * width + x) * 4;
      const luminance = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
      
      if (luminance > detectionThreshold) {
        candidates.push({ x, y, value: luminance });
      }
    }
    
    // Yield every 50 rows to prevent freezing
    processedRows++;
    if (processedRows % 50 === 0) {
      const progress = 30 + (processedRows / height) * 20;
      onProgress?.(progress, `Scanning rows... ${processedRows}/${height}`);
      await yieldToMain();
    }
  }
  
  console.log(`Found ${candidates.length} bright pixel candidates`);
  onProgress?.(50, `Found ${candidates.length} candidates, filtering...`);
  
  // Filter to local maxima only
  const stars: SimpleStar[] = [];
  const radius = 5; // Local maximum radius
  
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    let isMax = true;
    
    // Check if this is a local maximum
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = candidate.x + dx;
        const ny = candidate.y + dy;
        
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        
        const nidx = (ny * width + nx) * 4;
        const nluminance = getLuminance(data[nidx], data[nidx + 1], data[nidx + 2]);
        
        if (nluminance > candidate.value) {
          isMax = false;
          break;
        }
      }
      if (!isMax) break;
    }
    
    if (isMax) {
      // Calculate star size
      let starSize = 1;
      for (let r = 1; r <= settings.maxStarSize; r++) {
        let totalBright = 0;
        let totalPixels = 0;
        
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > r) continue;
            
            const nx = candidate.x + dx;
            const ny = candidate.y + dy;
            
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            
            const nidx = (ny * width + nx) * 4;
            const nluminance = getLuminance(data[nidx], data[nidx + 1], data[nidx + 2]);
            
            if (nluminance > detectionThreshold * 0.5) {
              totalBright++;
            }
            totalPixels++;
          }
        }
        
        if (totalBright / totalPixels < 0.3) {
          break;
        }
        starSize = r;
      }
      
      if (starSize >= settings.minStarSize) {
        const idx = (candidate.y * width + candidate.x) * 4;
        stars.push({
          x: candidate.x,
          y: candidate.y,
          brightness: candidate.value,
          size: starSize,
          color: {
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2]
          }
        });
      }
    }
    
    // Yield periodically
    if (i % 100 === 0) {
      const progress = 50 + (i / candidates.length) * 40;
      onProgress?.(progress, `Processing ${i}/${candidates.length}...`);
      await yieldToMain();
    }
  }
  
  console.log(`Detected ${stars.length} stars after local maximum filtering`);
  onProgress?.(100, 'Complete!');
  
  return stars;
}

/**
 * Remove detected stars from image
 */
export async function removeStarsSimple(
  imageElement: HTMLImageElement,
  stars: SimpleStar[],
  onProgress?: (progress: number, stage: string) => void
): Promise<{ starImage: string; starlessImage: string }> {
  onProgress?.(0, 'Creating canvases...');
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');
  
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  ctx.drawImage(imageElement, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  
  // Create star-only image
  onProgress?.(20, 'Rendering stars...');
  
  const starCanvas = document.createElement('canvas');
  const starCtx = starCanvas.getContext('2d')!;
  starCanvas.width = width;
  starCanvas.height = height;
  starCtx.fillStyle = 'black';
  starCtx.fillRect(0, 0, width, height);
  
  // Draw stars with glow
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const gradient = starCtx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 2);
    
    const color = `rgb(${star.color.r}, ${star.color.g}, ${star.color.b})`;
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, color.replace(')', ', 0.5)').replace('rgb', 'rgba'));
    gradient.addColorStop(1, 'transparent');
    
    starCtx.fillStyle = gradient;
    starCtx.fillRect(
      star.x - star.size * 2,
      star.y - star.size * 2,
      star.size * 4,
      star.size * 4
    );
    
    if (i % 50 === 0) {
      onProgress?.(20 + (i / stars.length) * 20, `Drawing stars ${i}/${stars.length}...`);
      await yieldToMain();
    }
  }
  
  const starImage = starCanvas.toDataURL('image/png');
  
  onProgress?.(40, 'Removing stars from nebula...');
  
  // Remove stars from original image using inpainting
  const starlessData = new ImageData(
    new Uint8ClampedArray(data),
    width,
    height
  );
  
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const radius = Math.ceil(star.size * 1.5);
    
    // Get background color from surrounding area
    let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
    const sampleRadius = radius * 3;
    
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const sx = Math.round(star.x + Math.cos(angle) * sampleRadius);
      const sy = Math.round(star.y + Math.sin(angle) * sampleRadius);
      
      if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
        const sidx = (sy * width + sx) * 4;
        bgR += data[sidx];
        bgG += data[sidx + 1];
        bgB += data[sidx + 2];
        bgCount++;
      }
    }
    
    if (bgCount > 0) {
      bgR /= bgCount;
      bgG /= bgCount;
      bgB /= bgCount;
    }
    
    // Replace star with background
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > radius) continue;
        
        const nx = star.x + dx;
        const ny = star.y + dy;
        
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        
        const nidx = (ny * width + nx) * 4;
        const alpha = 1 - (distance / radius);
        
        starlessData.data[nidx] = starlessData.data[nidx] * (1 - alpha) + bgR * alpha;
        starlessData.data[nidx + 1] = starlessData.data[nidx + 1] * (1 - alpha) + bgG * alpha;
        starlessData.data[nidx + 2] = starlessData.data[nidx + 2] * (1 - alpha) + bgB * alpha;
      }
    }
    
    if (i % 20 === 0) {
      onProgress?.(40 + (i / stars.length) * 50, `Inpainting ${i}/${stars.length}...`);
      await yieldToMain();
    }
  }
  
  ctx.putImageData(starlessData, 0, 0);
  const starlessImage = canvas.toDataURL('image/png');
  
  onProgress?.(100, 'Complete!');
  
  return { starImage, starlessImage };
}
