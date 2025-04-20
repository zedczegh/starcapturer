
import { generateRandomPoint } from '@/services/locationFilters';
import { isWaterLocation } from '@/utils/locationValidator';

self.onmessage = (e: MessageEvent) => {
  const { centerLat, centerLng, radius, count } = e.data;
  
  const points = [];
  for (let i = 0; i < count; i++) {
    const point = generateRandomPoint(centerLat, centerLng, radius);
    if (!isWaterLocation(point.latitude, point.longitude)) {
      points.push(point);
    }
  }
  
  self.postMessage(points);
};

export {};
