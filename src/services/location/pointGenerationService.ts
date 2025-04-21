
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';

/**
 * Generate a random point within a specified radius
 * Optimized to produce better distribution and prevent overloading
 */
export const generateRandomPoint = (
  centerLat: number, 
  centerLng: number, 
  radius: number
): { latitude: number, longitude: number, distance: number } => {
  // Use squared root distribution for more natural density gradient
  // This creates more points near the center and fewer at the edges
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
 * Uses adaptive density based on radius to prevent overloading
 */
export const generateDistributedPoints = (
  centerLat: number,
  centerLng: number,
  radius: number,
  count: number = 20
): { latitude: number, longitude: number, distance: number }[] => {
  // For larger radiuses, we want better distribution with fewer points
  // to avoid overloading the system
  const effectiveCount = Math.min(count, Math.max(10, Math.floor(count * (500 / Math.max(500, radius)))));
  const points: { latitude: number, longitude: number, distance: number }[] = [];
  
  // Generate initial random points (more than we need, to allow for better selection)
  for (let i = 0; i < effectiveCount * 3; i++) {
    points.push(generateRandomPoint(centerLat, centerLng, radius));
  }
  
  // Apply spatial distribution algorithm - Poisson-disc sampling approach
  // to ensure even distribution and prevent clustering
  const selectedPoints: { latitude: number, longitude: number, distance: number }[] = [];
  
  if (points.length > 0) {
    // Start with the closest point to center
    const closestToCenter = [...points].sort((a, b) => a.distance - b.distance)[0];
    selectedPoints.push(closestToCenter);
  }
  
  // Minimum distance between points, scaled by radius (larger radius = more spacing)
  // This prevents points from being too close together
  const minDistance = Math.max(5, radius / 20);
  
  while (selectedPoints.length < effectiveCount && points.length > selectedPoints.length) {
    let bestPoint = null;
    let bestMinDist = -1;
    
    for (const candidate of points) {
      // Skip if already selected
      if (selectedPoints.some(p => 
        p.latitude === candidate.latitude && 
        p.longitude === candidate.longitude
      )) continue;
      
      // Find minimum distance to any existing selected point
      let minDist = Infinity;
      for (const selected of selectedPoints) {
        const dist = calculateDistance(
          candidate.latitude, candidate.longitude,
          selected.latitude, selected.longitude
        );
        minDist = Math.min(minDist, dist);
      }
      
      // Select the point that is furthest from existing points
      // but maintain a minimum distance to ensure even distribution
      if (minDist > minDistance && minDist > bestMinDist) {
        bestMinDist = minDist;
        bestPoint = candidate;
      }
    }
    
    if (bestPoint) {
      selectedPoints.push(bestPoint);
    } else {
      // If we can't find a point with min distance, just take the next available
      // point with the maximum distance from existing points
      const remainingPoints = points.filter(p => 
        !selectedPoints.some(s => 
          s.latitude === p.latitude && 
          s.longitude === p.longitude
        )
      );
      
      if (remainingPoints.length > 0) {
        let maxMinDist = -1;
        let nextBestPoint = null;
        
        for (const candidate of remainingPoints) {
          let minDist = Infinity;
          for (const selected of selectedPoints) {
            const dist = calculateDistance(
              candidate.latitude, candidate.longitude,
              selected.latitude, selected.longitude
            );
            minDist = Math.min(minDist, dist);
          }
          
          if (minDist > maxMinDist) {
            maxMinDist = minDist;
            nextBestPoint = candidate;
          }
        }
        
        if (nextBestPoint) {
          selectedPoints.push(nextBestPoint);
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }
  
  return selectedPoints;
};
