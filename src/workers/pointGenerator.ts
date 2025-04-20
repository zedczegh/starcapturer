
import { generateRandomPoint } from '@/services/locationFilters';
import { isWaterLocation } from '@/utils/validation';

// Define the proper interface for points
interface Point {
  latitude: number; 
  longitude: number; 
  distance: number;
  region?: string;
}

self.onmessage = (e: MessageEvent) => {
  const { centerLat, centerLng, radius, count, regions } = e.data;
  
  // Use regional quadrant approach to generate better distributed points
  const points = generateDistributedPoints(centerLat, centerLng, radius, count, regions);
  
  self.postMessage(points);
};

/**
 * Generate points with better distribution by using quadrant regions
 * This improves performance by ensuring points are well-distributed
 */
function generateDistributedPoints(
  centerLat: number, 
  centerLng: number, 
  radius: number, 
  count: number,
  regions: any[] = []
): Array<Point> {
  const points: Point[] = [];
  const regionMap = new Map();
  
  // If regions were provided, use them to distribute points more evenly
  if (regions && regions.length > 0) {
    regions.forEach(region => {
      regionMap.set(region.id, {
        ...region,
        pointCount: Math.ceil(count / regions.length)
      });
    });
    
    // Generate points for each region
    for (const [regionId, region] of regionMap.entries()) {
      const regionPoints: Point[] = [];
      const attempts = region.pointCount * 3; // Try more times to ensure we get enough valid points
      
      for (let i = 0; i < attempts && regionPoints.length < region.pointCount; i++) {
        // Generate point in the region's boundary
        const point = generateRandomPointInRegion(
          region.center[0], 
          region.center[1], 
          region.radius || radius / 2
        );
        
        // Calculate distance from original center for sorting later
        point.distance = calculateDistance(centerLat, centerLng, point.latitude, point.longitude);
        point.region = regionId;
        
        // Only add points on land
        if (!isWaterLocation(point.latitude, point.longitude)) {
          regionPoints.push(point);
        }
      }
      
      points.push(...regionPoints);
    }
  } else {
    // No regions specified, use quadrant-based sampling for better distribution
    const quadrants = [
      { id: 'NE', lat: 1, lng: 1 },
      { id: 'NW', lat: 1, lng: -1 },
      { id: 'SE', lat: -1, lng: 1 },
      { id: 'SW', lat: -1, lng: -1 }
    ];
    
    // Generate points with balanced quadrant distribution
    const pointsPerQuadrant = Math.ceil(count / 4);
    
    quadrants.forEach(quadrant => {
      const quadrantPoints: Point[] = [];
      const attempts = pointsPerQuadrant * 3;
      
      for (let i = 0; i < attempts && quadrantPoints.length < pointsPerQuadrant; i++) {
        // Generate point in specific quadrant
        const point = generateRandomPointInQuadrant(
          centerLat, 
          centerLng, 
          radius, 
          quadrant.lat, 
          quadrant.lng
        );
        
        // Only add points on land
        if (!isWaterLocation(point.latitude, point.longitude)) {
          point.region = quadrant.id;
          quadrantPoints.push(point);
        }
      }
      
      points.push(...quadrantPoints);
    });
  }
  
  // Return at most 'count' points, with preference to closer points
  return points
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}

/**
 * Generate a random point within a specific quadrant relative to center
 */
function generateRandomPointInQuadrant(
  centerLat: number, 
  centerLng: number, 
  radiusKm: number,
  latSign: number,
  lngSign: number
): Point {
  // Convert radius from kilometers to degrees
  const radiusInDegrees = radiusKm / 111.32;
  
  // Generate random angle limited to the specified quadrant
  let minAngle = 0, maxAngle = 0;
  
  if (latSign > 0 && lngSign > 0) { // NE quadrant
    minAngle = 0;
    maxAngle = Math.PI / 2;
  } else if (latSign > 0 && lngSign < 0) { // NW quadrant
    minAngle = Math.PI / 2;
    maxAngle = Math.PI;
  } else if (latSign < 0 && lngSign < 0) { // SW quadrant
    minAngle = Math.PI;
    maxAngle = 3 * Math.PI / 2;
  } else { // SE quadrant
    minAngle = 3 * Math.PI / 2;
    maxAngle = 2 * Math.PI;
  }
  
  const randomAngle = minAngle + (Math.random() * (maxAngle - minAngle));
  
  // Random radius between 0.2*radiusInDegrees and radiusInDegrees 
  // (avoid too many points at center)
  const randomRadius = (0.2 + 0.8 * Math.random()) * radiusInDegrees;
  
  // Calculate the new position
  const latitude = centerLat + randomRadius * Math.cos(randomAngle);
  const longitude = centerLng + randomRadius * Math.sin(randomAngle) / Math.cos(centerLat * Math.PI / 180);
  
  // Calculate actual distance in kilometers for accurate display
  const distance = calculateDistance(centerLat, centerLng, latitude, longitude);
  
  return { latitude, longitude, distance };
}

/**
 * Generate a random point within a specific region's boundary
 */
function generateRandomPointInRegion(
  centerLat: number, 
  centerLng: number, 
  radiusKm: number
): Point {
  // Convert radius from kilometers to degrees
  const radiusInDegrees = radiusKm / 111.32;
  
  // Generate a random angle in radians (full circle)
  const randomAngle = Math.random() * Math.PI * 2;
  
  // Random radius between 0.1*radiusInDegrees and radiusInDegrees
  const randomRadius = (0.1 + 0.9 * Math.random()) * radiusInDegrees;
  
  // Calculate the new position
  const latitude = centerLat + randomRadius * Math.cos(randomAngle);
  const longitude = centerLng + randomRadius * Math.sin(randomAngle) / Math.cos(centerLat * Math.PI / 180);
  
  // Calculate actual distance in kilometers for accurate display
  const distance = calculateDistance(centerLat, centerLng, latitude, longitude);
  
  return { latitude, longitude, distance };
}

/**
 * Calculate the distance between two points using the Haversine formula
 */
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

export {};
