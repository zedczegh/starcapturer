/**
 * Enhanced Sonification Analysis
 * Incorporates advanced mathematical methods from AstroMath for richer audio generation
 */

export interface SpectralData {
  frequencies: { amplitude: number; frequency: number; phase: number; power: number }[];
  fundamentalFreq: number;
  dominantHarmonics: number[];
  spectralCentroid: number;
  spectralSpread: number;
  signalToNoise: number;
  phaseCoherence: number;
}

export interface StructureData {
  structures: Array<{
    centerX: number;
    centerY: number;
    semiMajor: number;
    semiMinor: number;
    eccentricity: number;
    rotation: number;
    pointCount: number;
  }>;
  rhythmicPattern: number[];
  spatialDistribution: number[];
}

export interface FractalData {
  dimension: number;
  complexity: number;
  textureLevel: number;
}

export interface EnhancedAnalysisResult {
  spectral: SpectralData;
  structures: StructureData;
  fractal: FractalData;
}

/**
 * Perform advanced Fourier analysis on image data
 * Uses proper windowing and spectral peak detection
 */
export function performSpectralAnalysis(imageData: ImageData): SpectralData {
  const { width, height, data } = imageData;
  
  // Sample luminance values with perceptual weighting (ITU-R BT.709)
  const sampleSize = Math.min(2048, Math.max(512, Math.min(width, height)));
  const samples: number[] = [];
  const stepY = Math.max(1, Math.floor(height / sampleSize));
  const stepX = Math.max(1, Math.floor(width / sampleSize));
  
  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const idx = (y * width + x) * 4;
      const r = Math.pow(data[idx] / 255, 2.2); // Gamma correction
      const g = Math.pow(data[idx + 1] / 255, 2.2);
      const b = Math.pow(data[idx + 2] / 255, 2.2);
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      samples.push(luminance);
    }
  }
  
  const N = samples.length;
  
  // Apply Blackman-Harris window for better frequency resolution
  const windowedSamples = samples.map((s, n) => {
    const a0 = 0.35875, a1 = 0.48829, a2 = 0.14128, a3 = 0.01168;
    const window = a0 - a1 * Math.cos((2 * Math.PI * n) / (N - 1)) +
                   a2 * Math.cos((4 * Math.PI * n) / (N - 1)) -
                   a3 * Math.cos((6 * Math.PI * n) / (N - 1));
    return s * window;
  });
  
  // Zero-padding for improved frequency resolution
  const paddedLength = Math.pow(2, Math.ceil(Math.log2(N * 2)));
  const paddedSamples = [...windowedSamples, ...Array(paddedLength - N).fill(0)];
  
  // Compute DFT for frequency analysis
  const frequencies: { amplitude: number; frequency: number; phase: number; power: number }[] = [];
  const numFreqs = Math.min(100, Math.floor(paddedLength / 4));
  
  for (let k = 1; k < numFreqs; k++) {
    let real = 0, imag = 0;
    for (let n = 0; n < paddedLength; n++) {
      const angle = (2 * Math.PI * k * n) / paddedLength;
      real += paddedSamples[n] * Math.cos(angle);
      imag -= paddedSamples[n] * Math.sin(angle);
    }
    const amplitude = Math.sqrt(real * real + imag * imag) / paddedLength;
    const power = (real * real + imag * imag) / (paddedLength * paddedLength);
    const phase = Math.atan2(imag, real);
    
    if (power > 1e-7) {
      frequencies.push({ amplitude, frequency: k * N / paddedLength, phase, power });
    }
  }
  
  frequencies.sort((a, b) => b.power - a.power);
  
  // Calculate spectral statistics
  const totalPower = frequencies.reduce((sum, f) => sum + f.power, 0);
  const spectralCentroid = frequencies.reduce((sum, f) => sum + f.frequency * f.power, 0) / totalPower;
  const spectralSpread = Math.sqrt(
    frequencies.reduce((sum, f) => sum + Math.pow(f.frequency - spectralCentroid, 2) * f.power, 0) / totalPower
  );
  
  // Calculate SNR
  const noisePower = frequencies.slice(-Math.floor(frequencies.length / 4))
    .reduce((sum, f) => sum + f.power, 0) / Math.floor(frequencies.length / 4);
  const signalPower = frequencies.slice(0, 12).reduce((sum, f) => sum + f.power, 0);
  const signalToNoise = 10 * Math.log10(signalPower / (noisePower + 1e-10));
  
  // Calculate phase coherence
  const phaseCoherence = frequencies.slice(0, 12).reduce((sum, f) => {
    const coherence = f.amplitude / Math.sqrt(f.power + 1e-10);
    return sum + coherence;
  }, 0) / Math.min(12, frequencies.length);
  
  // Extract dominant harmonics
  const dominantHarmonics = frequencies.slice(0, 8).map(f => f.frequency);
  
  return {
    frequencies: frequencies.slice(0, 50),
    fundamentalFreq: frequencies[0]?.frequency || 1,
    dominantHarmonics,
    spectralCentroid,
    spectralSpread,
    signalToNoise,
    phaseCoherence,
  };
}

/**
 * Detect parametric structures (ellipses, curves) in the image
 * Used for rhythmic pattern generation
 */
export function detectCosmicStructures(imageData: ImageData): StructureData {
  const { width, height, data } = imageData;
  
  // Find bright features with gradient information
  const brightPoints: { x: number; y: number; intensity: number; gradient: number }[] = [];
  
  for (let y = 2; y < height - 2; y += 3) {
    for (let x = 2; x < width - 2; x += 3) {
      const idx = (y * width + x) * 4;
      const intensity = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      // Calculate gradient
      const gx = -data[((y-1)*width+(x-1))*4] + data[((y-1)*width+(x+1))*4] +
                 -2*data[(y*width+(x-1))*4] + 2*data[(y*width+(x+1))*4] +
                 -data[((y+1)*width+(x-1))*4] + data[((y+1)*width+(x+1))*4];
      const gy = -data[((y-1)*width+(x-1))*4] - 2*data[((y-1)*width+x)*4] - data[((y-1)*width+(x+1))*4] +
                  data[((y+1)*width+(x-1))*4] + 2*data[((y+1)*width+x)*4] + data[((y+1)*width+(x+1))*4];
      const gradient = Math.sqrt(gx*gx + gy*gy);
      
      if (intensity > 120 && gradient > 20 && brightPoints.length < 800) {
        brightPoints.push({ x, y, intensity, gradient });
      }
    }
  }
  
  // Simple clustering
  const numClusters = Math.min(6, Math.max(2, Math.floor(brightPoints.length / 20)));
  const clusters = clusterPoints(brightPoints, numClusters);
  
  const structures = clusters.filter(c => c.length >= 5).map(cluster => {
    // Calculate weighted centroid
    const totalWeight = cluster.reduce((sum, p) => sum + p.intensity * p.gradient, 0);
    const centerX = cluster.reduce((sum, p) => sum + p.x * p.intensity * p.gradient, 0) / totalWeight;
    const centerY = cluster.reduce((sum, p) => sum + p.y * p.intensity * p.gradient, 0) / totalWeight;
    
    // Calculate covariance for ellipse fitting
    const points = cluster.map(p => ({ 
      dx: p.x - centerX, 
      dy: p.y - centerY,
      weight: p.intensity * p.gradient
    }));
    
    const totalPtsWeight = points.reduce((sum, p) => sum + p.weight, 0);
    const cov_xx = points.reduce((s, p) => s + p.dx * p.dx * p.weight, 0) / totalPtsWeight;
    const cov_yy = points.reduce((s, p) => s + p.dy * p.dy * p.weight, 0) / totalPtsWeight;
    const cov_xy = points.reduce((s, p) => s + p.dx * p.dy * p.weight, 0) / totalPtsWeight;
    
    // Eigenvalues for ellipse axes
    const trace = cov_xx + cov_yy;
    const det = cov_xx * cov_yy - cov_xy * cov_xy;
    const lambda1 = trace / 2 + Math.sqrt(Math.max(0, (trace * trace) / 4 - det));
    const lambda2 = trace / 2 - Math.sqrt(Math.max(0, (trace * trace) / 4 - det));
    
    const semiMajor = Math.sqrt(Math.abs(lambda1)) * 2;
    const semiMinor = Math.sqrt(Math.abs(lambda2)) * 2;
    const eccentricity = Math.sqrt(1 - Math.min(lambda2 / (lambda1 + 1e-10), 1));
    const rotation = Math.atan2(2 * cov_xy, cov_xx - cov_yy) / 2;
    
    return {
      centerX, centerY, semiMajor, semiMinor,
      eccentricity, rotation,
      pointCount: cluster.length
    };
  });
  
  // Generate rhythmic pattern based on structure eccentricities
  const rhythmicPattern = structures.map(s => {
    // More elliptical = faster rhythm, circular = slower
    return 0.25 + s.eccentricity * 0.75;
  });
  
  // Spatial distribution for panning
  const spatialDistribution = structures.map(s => {
    return (s.centerX / width) * 2 - 1; // -1 to 1
  });
  
  return {
    structures,
    rhythmicPattern: rhythmicPattern.length > 0 ? rhythmicPattern : [1, 0.5, 0.5],
    spatialDistribution: spatialDistribution.length > 0 ? spatialDistribution : [0],
  };
}

/**
 * Calculate fractal dimension using box-counting method
 * Used to control audio texture complexity
 */
export function calculateFractalDimension(imageData: ImageData): FractalData {
  const { width, height, data } = imageData;
  
  // Create binary image based on intensity threshold
  const threshold = 128;
  const binary: boolean[][] = [];
  
  for (let y = 0; y < height; y++) {
    binary[y] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const intensity = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      binary[y][x] = intensity > threshold;
    }
  }
  
  // Box-counting at different scales
  const scales = [2, 4, 8, 16, 32];
  const counts: number[] = [];
  
  for (const boxSize of scales) {
    let count = 0;
    for (let y = 0; y < height; y += boxSize) {
      for (let x = 0; x < width; x += boxSize) {
        // Check if box contains any bright pixels
        let hasPixel = false;
        for (let dy = 0; dy < boxSize && y + dy < height && !hasPixel; dy++) {
          for (let dx = 0; dx < boxSize && x + dx < width && !hasPixel; dx++) {
            if (binary[y + dy][x + dx]) {
              hasPixel = true;
            }
          }
        }
        if (hasPixel) count++;
      }
    }
    counts.push(count);
  }
  
  // Linear regression to find fractal dimension
  // D = -slope of log(count) vs log(1/boxSize)
  const logSizes = scales.map(s => Math.log(1 / s));
  const logCounts = counts.map(c => Math.log(c + 1));
  
  const n = scales.length;
  const sumX = logSizes.reduce((a, b) => a + b, 0);
  const sumY = logCounts.reduce((a, b) => a + b, 0);
  const sumXY = logSizes.reduce((sum, x, i) => sum + x * logCounts[i], 0);
  const sumXX = logSizes.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const dimension = Math.abs(slope);
  
  // Complexity: normalized dimension (1-2 range)
  const complexity = Math.min(1, Math.max(0, (dimension - 1) / 1));
  
  // Texture level based on high-frequency content
  let edgeCount = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
      const down = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
      if (Math.abs(right - center) > 30 || Math.abs(down - center) > 30) {
        edgeCount++;
      }
    }
  }
  const textureLevel = Math.min(1, edgeCount / (width * height * 0.1));
  
  return {
    dimension: dimension,
    complexity,
    textureLevel,
  };
}

/**
 * Simple k-means clustering
 */
function clusterPoints(
  points: { x: number; y: number; intensity: number; gradient: number }[],
  k: number
): typeof points[] {
  if (points.length === 0 || k === 0) return [];
  
  // Initialize centroids
  const centroids: { x: number; y: number }[] = [];
  for (let i = 0; i < k; i++) {
    const idx = Math.floor((i / k) * points.length);
    centroids.push({ x: points[idx].x, y: points[idx].y });
  }
  
  const clusters: typeof points[] = Array(k).fill(null).map(() => []);
  
  // Run k-means for a few iterations
  for (let iter = 0; iter < 10; iter++) {
    // Clear clusters
    clusters.forEach(c => c.length = 0);
    
    // Assign points to nearest centroid
    for (const point of points) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let i = 0; i < k; i++) {
        const dist = Math.sqrt(
          Math.pow(point.x - centroids[i].x, 2) +
          Math.pow(point.y - centroids[i].y, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          minIdx = i;
        }
      }
      clusters[minIdx].push(point);
    }
    
    // Update centroids
    for (let i = 0; i < k; i++) {
      if (clusters[i].length > 0) {
        centroids[i].x = clusters[i].reduce((sum, p) => sum + p.x, 0) / clusters[i].length;
        centroids[i].y = clusters[i].reduce((sum, p) => sum + p.y, 0) / clusters[i].length;
      }
    }
  }
  
  return clusters.filter(c => c.length > 0);
}
