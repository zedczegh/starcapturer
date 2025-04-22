import { generateRandomPoint } from '@/services/locationFilters';
import { isWaterLocation } from '@/utils/validation';

self.onmessage = (e: MessageEvent) => {
  const { centerLat, centerLng, radius, count } = e.data;
  
  const points = [];
  let attempts = 0;
  const maxAttempts = count * 3; // Allow more attempts to find valid points
  
  // Keep generating points until we reach the desired count or max attempts
  while (points.length < count && attempts < maxAttempts) {
    const point = generateRandomPoint(centerLat, centerLng, radius);
    attempts++;
    
    // Only add points that aren't on water
    if (!isWaterLocation(point.latitude, point.longitude)) {
      // Ensure points are sufficiently distant from each other
      if (!points.some(existingPoint => 
        Math.abs(existingPoint.latitude - point.latitude) < 0.02 && 
        Math.abs(existingPoint.longitude - point.longitude) < 0.02
      )) {
        points.push(point);
      }
    }
  }
  
  self.postMessage(points);
};

export {};
