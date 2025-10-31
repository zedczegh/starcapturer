/**
 * Improved Star Detection Algorithm
 * Uses shape analysis, PSF characteristics, and gradient detection
 * to distinguish stars from nebulae more accurately
 */

export interface ImprovedStar {
  x: number;
  y: number;
  brightness: number;
  radius: number;
  color: { r: number; g: number; b: number };
  circularity: number; // 0-1, how circular the star is
  sharpness: number; // 0-1, edge sharpness
  psfScore: number; // 0-1, how well it matches Point Spread Function
}

export interface ImprovedStarDetectionSettings {
  threshold: number; // Brightness threshold multiplier (0.5-2.0)
  sensitivity: number; // Detection sensitivity (0.5-1.5)
  minStarRadius: number; // Minimum star radius in pixels
  maxStarRadius: number; // Maximum star radius in pixels
  circularityThreshold: number; // Minimum circularity to be considered a star (0.6-1.0)
  sharpnessThreshold: number; // Minimum edge sharpness (0.5-1.0)
  psfThreshold: number; // Minimum PSF match score (0.5-1.0)
}

// Calculate luminance from RGB
function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Yield control to prevent UI freezing
async function yieldToMain() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

// Calculate gradient magnitude at a point
function calculateGradient(
  imageData: ImageData,
  x: number,
  y: number
): number {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) return 0;

  const getPixel = (px: number, py: number) => {
    const idx = (py * width + px) * 4;
    return getLuminance(data[idx], data[idx + 1], data[idx + 2]);
  };

  // Sobel operator
  const gx = 
    -1 * getPixel(x - 1, y - 1) + 1 * getPixel(x + 1, y - 1) +
    -2 * getPixel(x - 1, y) + 2 * getPixel(x + 1, y) +
    -1 * getPixel(x - 1, y + 1) + 1 * getPixel(x + 1, y + 1);

  const gy =
    -1 * getPixel(x - 1, y - 1) - 2 * getPixel(x, y - 1) - 1 * getPixel(x + 1, y - 1) +
    1 * getPixel(x - 1, y + 1) + 2 * getPixel(x, y + 1) + 1 * getPixel(x + 1, y + 1);

  return Math.sqrt(gx * gx + gy * gy);
}

// Check if brightness falls off radially (characteristic of stars)
function calculatePSFScore(
  imageData: ImageData,
  centerX: number,
  centerY: number,
  radius: number
): number {
  const data = imageData.data;
  const width = imageData.width;
  
  const getPixelBrightness = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= imageData.height) return 0;
    const idx = (y * width + x) * 4;
    return getLuminance(data[idx], data[idx + 1], data[idx + 2]);
  };

  const centerBrightness = getPixelBrightness(Math.round(centerX), Math.round(centerY));
  if (centerBrightness < 100) return 0;

  // Sample at different radii
  let scoreSum = 0;
  let samples = 0;
  const rings = 3;

  for (let ring = 1; ring <= rings; ring++) {
    const r = radius * (ring / rings);
    const expectedBrightness = centerBrightness * Math.exp(-ring * 0.7); // Expected falloff
    
    // Sample 8 points around the ring
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const x = Math.round(centerX + r * Math.cos(angle));
      const y = Math.round(centerY + r * Math.sin(angle));
      const actualBrightness = getPixelBrightness(x, y);
      
      // Score based on how well it matches expected radial falloff
      const ratio = actualBrightness / Math.max(expectedBrightness, 1);
      const score = Math.max(0, 1 - Math.abs(ratio - 1));
      scoreSum += score;
      samples++;
    }
  }

  return samples > 0 ? scoreSum / samples : 0;
}

// Measure circularity using variance of distances from center
function calculateCircularity(
  imageData: ImageData,
  centerX: number,
  centerY: number,
  radius: number,
  threshold: number
): number {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Find edge points above threshold
  const edgePoints: { x: number; y: number; dist: number }[] = [];
  
  for (let y = Math.max(0, Math.floor(centerY - radius - 2)); 
       y < Math.min(height, Math.ceil(centerY + radius + 2)); y++) {
    for (let x = Math.max(0, Math.floor(centerX - radius - 2)); 
         x < Math.min(width, Math.ceil(centerX + radius + 2)); x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > radius - 2 && dist < radius + 2) {
        const idx = (y * width + x) * 4;
        const brightness = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
        
        if (brightness > threshold) {
          edgePoints.push({ x, y, dist });
        }
      }
    }
  }

  if (edgePoints.length < 8) return 0;

  // Calculate variance of distances
  const distances = edgePoints.map(p => p.dist);
  const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
  const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDist, 2), 0) / distances.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower variance = more circular (normalized)
  const circularity = Math.max(0, 1 - (stdDev / radius));
  return circularity;
}

/**
 * Detect stars using improved shape and gradient analysis
 */
export async function detectStarsImproved(
  imageElement: HTMLImageElement,
  settings: ImprovedStarDetectionSettings,
  onProgress?: (progress: number, stage: string) => void
): Promise<ImprovedStar[]> {
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas context');
  
  ctx.drawImage(imageElement, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  onProgress?.(10, 'Analyzing image statistics...');

  // Calculate brightness statistics
  const brightnesses: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    brightnesses.push(getLuminance(data[i], data[i + 1], data[i + 2]));
  }
  
  brightnesses.sort((a, b) => a - b);
  const median = brightnesses[Math.floor(brightnesses.length * 0.5)];
  const p90 = brightnesses[Math.floor(brightnesses.length * 0.90)];
  const p95 = brightnesses[Math.floor(brightnesses.length * 0.95)];
  const p99 = brightnesses[Math.floor(brightnesses.length * 0.99)];
  
  // Dynamic threshold based on image statistics
  const dynamicThreshold = median + (p99 - median) * settings.threshold;
  
  console.log('📊 Detection statistics:', {
    median: median.toFixed(2),
    p90: p90.toFixed(2),
    p95: p95.toFixed(2),
    p99: p99.toFixed(2),
    threshold: dynamicThreshold.toFixed(2),
    imageSize: `${width}x${height}`
  });

  onProgress?.(20, 'Finding bright candidates...');

  // Find bright pixel candidates
  const candidates: { x: number; y: number; brightness: number }[] = [];
  
  for (let y = settings.maxStarRadius; y < height - settings.maxStarRadius; y++) {
    for (let x = settings.maxStarRadius; x < width - settings.maxStarRadius; x++) {
      const idx = (y * width + x) * 4;
      const brightness = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
      
      if (brightness > dynamicThreshold) {
        candidates.push({ x, y, brightness });
      }
    }
    
    if (y % 50 === 0) await yieldToMain();
  }

  console.log(`✨ Found ${candidates.length} bright candidates`);
  onProgress?.(40, `Analyzing ${candidates.length} candidates...`);
  
  if (candidates.length === 0) {
    console.warn('⚠️ No bright candidates found - threshold may be too high');
    return [];
  }

  // Filter for local maxima
  const localMaxima: { x: number; y: number; brightness: number }[] = [];
  const minDistance = settings.minStarRadius;

  for (const candidate of candidates) {
    let isLocalMax = true;
    
    // Check if it's the brightest in its neighborhood
    for (let dy = -minDistance; dy <= minDistance; dy++) {
      for (let dx = -minDistance; dx <= minDistance; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = candidate.x + dx;
        const ny = candidate.y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const idx = (ny * width + nx) * 4;
          const neighborBrightness = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
          
          if (neighborBrightness > candidate.brightness) {
            isLocalMax = false;
            break;
          }
        }
      }
      if (!isLocalMax) break;
    }
    
    if (isLocalMax) {
      localMaxima.push(candidate);
    }
  }

  console.log(`🎯 Found ${localMaxima.length} local maxima`);
  onProgress?.(60, `Analyzing shape characteristics...`);
  
  if (localMaxima.length === 0) {
    console.warn('⚠️ No local maxima found - stars may be too close together');
    return [];
  }

  // Analyze each local maximum for star characteristics
  const detectedStars: ImprovedStar[] = [];
  let processedCount = 0;

  for (const maximum of localMaxima) {
    // Estimate radius by finding where brightness drops significantly
    let radius = settings.minStarRadius;
    const centerBrightness = maximum.brightness;
    const dropThreshold = centerBrightness * 0.3;

    for (let r = settings.minStarRadius; r <= settings.maxStarRadius; r++) {
      const sampleX = Math.round(maximum.x + r);
      const sampleY = maximum.y;
      
      if (sampleX < width) {
        const idx = (sampleY * width + sampleX) * 4;
        const sampleBrightness = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
        
        if (sampleBrightness < dropThreshold) {
          radius = r;
          break;
        }
      }
    }

    // Calculate star characteristics
    const circularity = calculateCircularity(
      imageData,
      maximum.x,
      maximum.y,
      radius,
      dynamicThreshold * 0.5
    );

    const psfScore = calculatePSFScore(
      imageData,
      maximum.x,
      maximum.y,
      radius
    );

    // Calculate average edge sharpness around the star
    let sharpnessSum = 0;
    let sharpnessSamples = 0;
    
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const edgeX = Math.round(maximum.x + radius * Math.cos(angle));
      const edgeY = Math.round(maximum.y + radius * Math.sin(angle));
      const gradient = calculateGradient(imageData, edgeX, edgeY);
      sharpnessSum += gradient;
      sharpnessSamples++;
    }
    
    const avgSharpness = sharpnessSum / sharpnessSamples;
    const sharpness = Math.min(1, avgSharpness / 200); // Normalize

    // Get star color
    const idx = (maximum.y * width + maximum.x) * 4;
    const color = {
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2]
    };

    // Check criteria and log failures for first few stars
    const passesCircularity = circularity >= settings.circularityThreshold;
    const passesSharpness = sharpness >= settings.sharpnessThreshold;
    const passesPSF = psfScore >= settings.psfThreshold;
    const passesRadius = radius >= settings.minStarRadius && radius <= settings.maxStarRadius;
    
    if (processedCount < 5) {
      console.log(`⭐ Candidate ${processedCount + 1}:`, {
        circularity: circularity.toFixed(2),
        passesCircularity,
        sharpness: sharpness.toFixed(2),
        passesSharpness,
        psfScore: psfScore.toFixed(2),
        passesPSF,
        radius: radius.toFixed(1),
        passesRadius
      });
    }
    
    // Only keep if it meets all star criteria
    if (passesCircularity && passesSharpness && passesPSF && passesRadius) {
      detectedStars.push({
        x: maximum.x,
        y: maximum.y,
        brightness: maximum.brightness,
        radius,
        color,
        circularity,
        sharpness,
        psfScore
      });
    }

    processedCount++;
    if (processedCount % 50 === 0) {
      onProgress?.(60 + (processedCount / localMaxima.length) * 30, 
        `Analyzed ${processedCount}/${localMaxima.length} candidates...`);
      await yieldToMain();
    }
  }

  console.log(`✅ Detected ${detectedStars.length} stars after filtering (from ${localMaxima.length} candidates)`);
  
  if (detectedStars.length === 0) {
    console.error('❌ NO STARS DETECTED - Thresholds may be too strict!');
    console.log('💡 Try lowering: Circularity, Sharpness, or PSF thresholds');
  } else {
    console.log('Sample star characteristics:', detectedStars.slice(0, 3).map(s => ({
      circularity: s.circularity.toFixed(2),
      sharpness: s.sharpness.toFixed(2),
      psfScore: s.psfScore.toFixed(2),
      radius: s.radius.toFixed(1)
    })));
  }

  onProgress?.(100, `Detected ${detectedStars.length} stars`);
  return detectedStars;
}

/**
 * Remove detected stars using intelligent inpainting
 */
export async function removeStarsImproved(
  imageElement: HTMLImageElement,
  stars: ImprovedStar[],
  onProgress?: (progress: number, stage: string) => void
): Promise<{ starImage: string; starlessImage: string }> {
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas context');
  
  ctx.drawImage(imageElement, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  onProgress?.(10, 'Creating star mask...');

  // Create star-only image
  const starCanvas = document.createElement('canvas');
  starCanvas.width = width;
  starCanvas.height = height;
  const starCtx = starCanvas.getContext('2d');
  if (!starCtx) throw new Error('Could not get star canvas context');
  
  starCtx.fillStyle = 'black';
  starCtx.fillRect(0, 0, width, height);

  // Draw stars with glow
  for (const star of stars) {
    const gradient = starCtx.createRadialGradient(
      star.x, star.y, 0,
      star.x, star.y, star.radius * 2
    );
    
    const color = `rgb(${star.color.r}, ${star.color.g}, ${star.color.b})`;
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, 0.5)`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    starCtx.fillStyle = gradient;
    starCtx.fillRect(
      star.x - star.radius * 2,
      star.y - star.radius * 2,
      star.radius * 4,
      star.radius * 4
    );
  }

  onProgress?.(30, 'Removing stars from image...');

  // Remove stars using smart inpainting
  const starlessData = new Uint8ClampedArray(data);
  let processedStars = 0;

  for (const star of stars) {
    // Inpaint area with background estimation
    const inpaintRadius = Math.ceil(star.radius * 1.5);
    const sampleRadius = Math.ceil(star.radius * 2.5);

    // Sample background color from ring around the star
    let bgR = 0, bgG = 0, bgB = 0;
    let bgSamples = 0;

    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
      const sampleX = Math.round(star.x + sampleRadius * Math.cos(angle));
      const sampleY = Math.round(star.y + sampleRadius * Math.sin(angle));

      if (sampleX >= 0 && sampleX < width && sampleY >= 0 && sampleY < height) {
        const idx = (sampleY * width + sampleX) * 4;
        bgR += starlessData[idx];
        bgG += starlessData[idx + 1];
        bgB += starlessData[idx + 2];
        bgSamples++;
      }
    }

    if (bgSamples > 0) {
      bgR /= bgSamples;
      bgG /= bgSamples;
      bgB /= bgSamples;
    }

    // Replace star with background using smooth transition
    for (let dy = -inpaintRadius; dy <= inpaintRadius; dy++) {
      for (let dx = -inpaintRadius; dx <= inpaintRadius; dx++) {
        const x = Math.round(star.x + dx);
        const y = Math.round(star.y + dy);

        if (x >= 0 && x < width && y >= 0 && y < height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist <= inpaintRadius) {
            const idx = (y * width + x) * 4;
            
            // Smooth blend based on distance
            const blendFactor = Math.max(0, 1 - dist / inpaintRadius);
            const invBlend = 1 - blendFactor;
            
            starlessData[idx] = starlessData[idx] * invBlend + bgR * blendFactor;
            starlessData[idx + 1] = starlessData[idx + 1] * invBlend + bgG * blendFactor;
            starlessData[idx + 2] = starlessData[idx + 2] * invBlend + bgB * blendFactor;
          }
        }
      }
    }

    processedStars++;
    if (processedStars % 50 === 0) {
      onProgress?.(30 + (processedStars / stars.length) * 60,
        `Removed ${processedStars}/${stars.length} stars...`);
      await yieldToMain();
    }
  }

  // Create starless image
  const starlessImageData = new ImageData(starlessData, width, height);
  ctx.putImageData(starlessImageData, 0, 0);
  const starlessImage = canvas.toDataURL('image/png');

  onProgress?.(100, 'Complete!');

  return {
    starImage: starCanvas.toDataURL('image/png'),
    starlessImage
  };
}
