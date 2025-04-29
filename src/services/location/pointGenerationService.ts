
import { calculateDistance } from '@/utils/geoUtils';

/**
 * Generate a random point within a specified radius
 */
export const generateRandomPoint = (
  centerLat: number, 
  centerLng: number, 
  radius: number
): { latitude: number, longitude: number, distance: number } => {
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
 * Generate multiple points with improved distribution
 */
export const generateDistributedPoints = (
  centerLat: number,
  centerLng: number,
  radius: number,
  count: number = 20
): { latitude: number, longitude: number, distance: number }[] => {
  const points: { latitude: number, longitude: number, distance: number }[] = [];
  
  // Generate initial random points
  for (let i = 0; i < count * 2; i++) {
    points.push(generateRandomPoint(centerLat, centerLng, radius));
  }
  
  // Apply spatial distribution algorithm
  const selectedPoints: { latitude: number, longitude: number, distance: number }[] = [];
  
  if (points.length > 0) {
    selectedPoints.push(points[0]);
  }
  
  while (selectedPoints.length < count && points.length > selectedPoints.length) {
    let bestPoint = null;
    let bestMinDist = -1;
    
    for (const candidate of points) {
      if (selectedPoints.some(p => p === candidate)) continue;
      
      let minDist = Infinity;
      for (const selected of selectedPoints) {
        const dist = calculateDistance(
          candidate.latitude, candidate.longitude,
          selected.latitude, selected.longitude
        );
        minDist = Math.min(minDist, dist);
      }
      
      if (minDist > bestMinDist) {
        bestMinDist = minDist;
        bestPoint = candidate;
      }
    }
    
    if (bestPoint) {
      selectedPoints.push(bestPoint);
    } else {
      break;
    }
  }
  
  return selectedPoints;
};
