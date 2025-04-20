import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';

// Advanced point distribution strategies
const DISTRIBUTION_STRATEGIES = {
  RANDOM: 'random',
  GRID: 'grid',
  FIBONACCI: 'fibonacci',
  BLUE_NOISE: 'blue_noise'
};

// Use Poisson disk sampling for better point distribution
const MIN_DISTANCE_BETWEEN_POINTS = 2; // km

/**
 * Generate a random point within a specified radius with improved distribution
 */
export const generateRandomPoint = (
  centerLat: number, 
  centerLng: number, 
  radius: number,
  strategy = DISTRIBUTION_STRATEGIES.RANDOM
): { latitude: number, longitude: number, distance: number } => {
  // Use more advanced distribution based on selected strategy
  if (strategy === DISTRIBUTION_STRATEGIES.FIBONACCI) {
    return generateFibonacciPoint(centerLat, centerLng, radius);
  }
  
  // Default improved random distribution
  // Use squared root distribution for more natural density gradient
  const r = radius * Math.sqrt(Math.random());
  const theta = Math.random() * 2 * Math.PI;
  
  // Convert to cartesian coordinates
  const x = r * Math.cos(theta);
  const y = r * Math.sin(theta);
  
  // Convert to lat/lng with Earth's curvature consideration
  const latRadians = centerLat * (Math.PI / 180);
  const kmPerDegreeLat = 111.32;
  const kmPerDegreeLng = 111.32 * Math.cos(latRadians);
  
  const newLat = centerLat + (y / kmPerDegreeLat);
  const newLng = centerLng + (x / kmPerDegreeLng);
  
  const distance = calculateDistance(centerLat, centerLng, newLat, newLng);
  
  return {
    latitude: newLat,
    longitude: newLng,
    distance
  };
};

/**
 * Generate a point using Fibonacci sphere for optimal spherical distribution
 */
const generateFibonacciPoint = (
  centerLat: number,
  centerLng: number,
  radius: number
): { latitude: number, longitude: number, distance: number } => {
  // Use golden ratio for optimal point distribution
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const i = Math.floor(Math.random() * 100); // Random index
  
  // Generate point on unit sphere
  const y = 1 - (i / 50); // -1 to 1
  const radiusAtY = Math.sqrt(1 - y * y);
  
  const theta = 2 * Math.PI * i / goldenRatio;
  const x = Math.cos(theta) * radiusAtY;
  const z = Math.sin(theta) * radiusAtY;
  
  // Scale to desired radius (random distance within radius)
  const distance = Math.random() * radius;
  const scaleFactor = distance / Math.sqrt(x*x + y*y + z*z);
  
  // Convert spherical coordinates back to lat/lng
  const xKm = x * scaleFactor;
  const yKm = y * scaleFactor;
  
  // Convert km offsets to lat/lng
  const latRadians = centerLat * (Math.PI / 180);
  const kmPerDegreeLat = 111.32;
  const kmPerDegreeLng = 111.32 * Math.cos(latRadians);
  
  const newLat = centerLat + (yKm / kmPerDegreeLat);
  const newLng = centerLng + (xKm / kmPerDegreeLng);
  
  return {
    latitude: newLat,
    longitude: newLng,
    distance
  };
};

/**
 * Generate multiple points with improved distribution using Blue Noise algorithm
 * Blue Noise gives more natural-looking point distributions
 */
export const generateDistributedPoints = (
  centerLat: number,
  centerLng: number,
  radius: number,
  count: number = 20,
  strategy = DISTRIBUTION_STRATEGIES.BLUE_NOISE
): { latitude: number, longitude: number, distance: number }[] => {
  // For large radii, use different strategies for better performance
  const effectiveStrategy = radius > 500 ? DISTRIBUTION_STRATEGIES.GRID : strategy;
  
  if (effectiveStrategy === DISTRIBUTION_STRATEGIES.GRID) {
    return generateGridPoints(centerLat, centerLng, radius, count);
  }
  
  // Blue noise algorithm (Poisson disk sampling)
  const points: { latitude: number, longitude: number, distance: number }[] = [];
  const candidatePoints: { latitude: number, longitude: number, distance: number }[] = [];
  const attempts = Math.max(count * 4, 100); // More attempts for better coverage
  
  // Generate initial random point
  const initialPoint = generateRandomPoint(centerLat, centerLng, radius, DISTRIBUTION_STRATEGIES.FIBONACCI);
  points.push(initialPoint);
  
  // Generate more points based on Poisson disk sampling
  for (let i = 0; i < attempts && points.length < count; i++) {
    const nextPoint = generateRandomPoint(centerLat, centerLng, radius);
    candidatePoints.push(nextPoint);
    
    // Check if point is far enough from existing points
    let valid = true;
    for (const point of points) {
      const dist = calculateDistance(
        nextPoint.latitude, nextPoint.longitude,
        point.latitude, point.longitude
      );
      
      // Adaptive minimum distance based on radius
      const minDistance = Math.min(MIN_DISTANCE_BETWEEN_POINTS, radius / 10);
      
      if (dist < minDistance) {
        valid = false;
        break;
      }
    }
    
    if (valid) {
      points.push(nextPoint);
    }
  }
  
  // If we don't have enough points, fill with candidate points
  if (points.length < count) {
    // Sort candidate points by maximum distance to existing points
    candidatePoints.sort((a, b) => {
      const aMinDist = Math.min(...points.map(p => 
        calculateDistance(a.latitude, a.longitude, p.latitude, p.longitude)));
      const bMinDist = Math.min(...points.map(p => 
        calculateDistance(b.latitude, b.longitude, p.latitude, p.longitude)));
      return bMinDist - aMinDist; // Descending order
    });
    
    // Add candidates until we reach desired count
    let i = 0;
    while (points.length < count && i < candidatePoints.length) {
      points.push(candidatePoints[i]);
      i++;
    }
  }
  
  return points;
};

/**
 * Generate points in a grid pattern, more efficient for large areas
 */
const generateGridPoints = (
  centerLat: number,
  centerLng: number,
  radius: number, 
  count: number
): { latitude: number, longitude: number, distance: number }[] => {
  const points: { latitude: number, longitude: number, distance: number }[] = [];
  
  // Calculate grid size based on count and area
  const gridSize = Math.ceil(Math.sqrt(count * 2));
  const cellSize = (radius * 2) / gridSize;
  
  const latRadians = centerLat * (Math.PI / 180);
  const kmPerDegreeLat = 111.32;
  const kmPerDegreeLng = 111.32 * Math.cos(latRadians);
  
  const latStep = cellSize / kmPerDegreeLat;
  const lngStep = cellSize / kmPerDegreeLng;
  
  const startLat = centerLat - radius / kmPerDegreeLat;
  const startLng = centerLng - radius / kmPerDegreeLng;
  
  // Add small random offset to grid points to make them look more natural
  const jitterFactor = 0.3; // 30% of cell size
  
  // Generate grid with some randomness
  for (let i = 0; i < gridSize && points.length < count * 2; i++) {
    for (let j = 0; j < gridSize && points.length < count * 2; j++) {
      const jitterLat = (Math.random() - 0.5) * latStep * jitterFactor;
      const jitterLng = (Math.random() - 0.5) * lngStep * jitterFactor;
      
      const lat = startLat + (i + 0.5) * latStep + jitterLat;
      const lng = startLng + (j + 0.5) * lngStep + jitterLng;
      
      const distance = calculateDistance(centerLat, centerLng, lat, lng);
      
      // Only include points within the radius
      if (distance <= radius) {
        points.push({ latitude: lat, longitude: lng, distance });
      }
    }
  }
  
  // If we have too many points, select a random subset (with preference to closer points)
  if (points.length > count) {
    points.sort((a, b) => a.distance - b.distance);
    
    // Keep some of the closest points
    const closestCount = Math.floor(count * 0.3);
    const closestPoints = points.slice(0, closestCount);
    
    // Randomly select the rest
    const remainingPoints = points.slice(closestCount)
      .sort(() => Math.random() - 0.5)
      .slice(0, count - closestCount);
    
    return [...closestPoints, ...remainingPoints];
  }
  
  return points;
};
