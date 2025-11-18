/**
 * Advanced data fusion algorithm for Bortle scale calculation
 * Combines multiple data sources with confidence weighting
 */

export interface BortleDataSource {
  bortleScale: number;
  confidence: number; // 0-1 scale
  source: string;
  timestamp?: number; // Unix timestamp
  metadata?: Record<string, any>;
}

// Half-life for temporal decay (30 days)
const TEMPORAL_HALF_LIFE = 30 * 24 * 60 * 60 * 1000;

/**
 * Fuse multiple Bortle scale measurements using weighted confidence
 * @param sources Array of Bortle data from different sources
 * @param options Fusion options
 * @returns Fused Bortle scale with confidence
 */
export function fuseBortleScales(
  sources: BortleDataSource[],
  options: {
    useTemporalDecay?: boolean;
    minConfidence?: number;
  } = {}
): { bortleScale: number; confidence: number; sources: string[] } | null {
  const {
    useTemporalDecay = true,
    minConfidence = 0.1
  } = options;

  if (!sources || sources.length === 0) {
    return null;
  }

  // Filter out low-confidence sources
  const validSources = sources.filter(s => 
    s.confidence >= minConfidence &&
    s.bortleScale >= 1 &&
    s.bortleScale <= 9
  );

  if (validSources.length === 0) {
    return null;
  }

  // If only one source, return it
  if (validSources.length === 1) {
    return {
      bortleScale: validSources[0].bortleScale,
      confidence: validSources[0].confidence,
      sources: [validSources[0].source]
    };
  }

  const now = Date.now();
  let totalWeight = 0;
  let weightedSum = 0;

  for (const source of validSources) {
    let weight = source.confidence;

    // Apply temporal decay if enabled
    if (useTemporalDecay && source.timestamp) {
      const age = now - source.timestamp;
      const decayFactor = Math.exp(-age / TEMPORAL_HALF_LIFE);
      weight *= decayFactor;
    }

    weightedSum += source.bortleScale * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return null;
  }

  const fusedBortle = weightedSum / totalWeight;
  const fusedConfidence = totalWeight / validSources.length; // Normalized confidence

  return {
    bortleScale: Math.round(fusedBortle * 10) / 10, // Round to 1 decimal
    confidence: Math.min(1, fusedConfidence),
    sources: validSources.map(s => s.source)
  };
}

/**
 * Apply Gaussian Process-based interpolation for spatial data
 * Better than simple inverse distance weighting
 * @param targetLat Target latitude
 * @param targetLon Target longitude
 * @param nearbyPoints Nearby measured points
 * @param lengthScale Characteristic distance (km)
 * @returns Interpolated Bortle scale
 */
export function gaussianProcessInterpolation(
  targetLat: number,
  targetLon: number,
  nearbyPoints: Array<{
    lat: number;
    lon: number;
    bortleScale: number;
    uncertainty?: number;
  }>,
  lengthScale: number = 50
): { bortleScale: number; uncertainty: number } | null {
  if (!nearbyPoints || nearbyPoints.length === 0) {
    return null;
  }

  // Calculate distances using Haversine formula
  const distances = nearbyPoints.map(point => {
    const R = 6371; // Earth radius in km
    const dLat = (point.lat - targetLat) * Math.PI / 180;
    const dLon = (point.lon - targetLon) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(targetLat * Math.PI / 180) * Math.cos(point.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  });

  // RBF kernel (Squared Exponential)
  const kernelWeights = distances.map(d => 
    Math.exp(-(d * d) / (2 * lengthScale * lengthScale))
  );

  // Weighted interpolation
  let totalWeight = 0;
  let weightedSum = 0;
  let weightedVariance = 0;

  for (let i = 0; i < nearbyPoints.length; i++) {
    const weight = kernelWeights[i];
    const uncertainty = nearbyPoints[i].uncertainty || 0.5;

    weightedSum += nearbyPoints[i].bortleScale * weight;
    weightedVariance += uncertainty * uncertainty * weight * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return null;
  }

  const interpolatedBortle = weightedSum / totalWeight;
  const interpolatedUncertainty = Math.sqrt(weightedVariance) / totalWeight;

  return {
    bortleScale: Math.max(1, Math.min(9, interpolatedBortle)),
    uncertainty: interpolatedUncertainty
  };
}

/**
 * Detect and handle outliers using Modified Z-Score
 * @param sources Array of Bortle measurements
 * @param threshold Z-score threshold (default 3.5)
 * @returns Filtered sources without outliers
 */
export function filterOutliers(
  sources: BortleDataSource[],
  threshold: number = 3.5
): BortleDataSource[] {
  if (sources.length < 3) {
    return sources; // Need at least 3 points to detect outliers
  }

  const values = sources.map(s => s.bortleScale);
  const median = calculateMedian(values);
  const mad = calculateMAD(values, median);

  if (mad === 0) {
    return sources; // All values are identical
  }

  // Modified Z-score
  return sources.filter(source => {
    const modifiedZ = Math.abs(0.6745 * (source.bortleScale - median) / mad);
    return modifiedZ < threshold;
  });
}

/**
 * Calculate median of array
 */
function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate Median Absolute Deviation
 */
function calculateMAD(values: number[], median: number): number {
  const deviations = values.map(v => Math.abs(v - median));
  return calculateMedian(deviations);
}

/**
 * Calculate confidence from multiple factors
 * @param factors Confidence factors
 * @returns Combined confidence (0-1)
 */
export function calculateCombinedConfidence(factors: {
  dataQuality?: number;
  recency?: number;
  sourceReliability?: number;
  sampleSize?: number;
}): number {
  const {
    dataQuality = 0.7,
    recency = 0.8,
    sourceReliability = 0.9,
    sampleSize = 0.6
  } = factors;

  // Weighted geometric mean for conservative estimate
  const weights = [0.4, 0.2, 0.3, 0.1];
  const values = [dataQuality, recency, sourceReliability, sampleSize];

  const product = values.reduce((acc, val, i) => acc * Math.pow(val, weights[i]), 1);
  return Math.max(0, Math.min(1, product));
}
