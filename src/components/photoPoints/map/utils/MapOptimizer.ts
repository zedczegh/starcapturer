
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { formatSiqsScore } from "@/utils/siqsHelpers";

/**
 * Utility for optimizing map marker rendering
 */
export class MapOptimizer {
  /**
   * Filter locations to only show those in the current viewport
   */
  static filterByViewport(
    locations: SharedAstroSpot[],
    bounds: [number, number, number, number] | null
  ): SharedAstroSpot[] {
    if (!bounds || !locations.length) return locations;
    
    const [minLat, minLng, maxLat, maxLng] = bounds;
    
    return locations.filter(loc => {
      if (!loc.latitude || !loc.longitude) return false;
      
      // Check if the location is within the bounds
      return (
        loc.latitude >= minLat &&
        loc.latitude <= maxLat &&
        loc.longitude >= minLng &&
        loc.longitude <= maxLng
      );
    });
  }
  
  /**
   * Create clusters of locations that are close together
   */
  static createClusters(
    locations: SharedAstroSpot[],
    clusterRadius: number = 1 // degrees
  ): { 
    clusters: Array<{
      center: [number, number];
      count: number;
      averageSiqs: number;
      points: SharedAstroSpot[];
    }>,
    singlePoints: SharedAstroSpot[]
  } {
    const clusters: Array<{
      center: [number, number];
      count: number;
      averageSiqs: number;
      points: SharedAstroSpot[];
    }> = [];
    
    const singlePoints: SharedAstroSpot[] = [];
    const processedPoints = new Set();
    
    // Function to calculate distance between two points
    const distanceBetweenPoints = (
      lat1: number, lon1: number, lat2: number, lon2: number
    ): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    // Process each location
    for (let i = 0; i < locations.length; i++) {
      const point = locations[i];
      
      // Skip if already processed or missing coordinates
      if (
        processedPoints.has(i) || 
        !point.latitude || 
        !point.longitude
      ) continue;
      
      // Find all points within clustering distance
      const nearbyPoints = locations.filter((otherPoint, j) => {
        if (
          i === j || 
          processedPoints.has(j) ||
          !otherPoint.latitude || 
          !otherPoint.longitude
        ) return false;
        
        const distance = distanceBetweenPoints(
          point.latitude,
          point.longitude,
          otherPoint.latitude,
          otherPoint.longitude
        );
        
        return distance <= clusterRadius;
      });
      
      // If we found nearby points, create a cluster
      if (nearbyPoints.length > 0) {
        const clusterPoints = [point, ...nearbyPoints];
        
        // Mark all these points as processed
        processedPoints.add(i);
        nearbyPoints.forEach((_, j) => {
          const originalIndex = locations.indexOf(nearbyPoints[j]);
          if (originalIndex >= 0) {
            processedPoints.add(originalIndex);
          }
        });
        
        // Calculate cluster center and average SIQS
        const latSum = clusterPoints.reduce((sum, p) => sum + p.latitude!, 0);
        const lonSum = clusterPoints.reduce((sum, p) => sum + p.longitude!, 0);
        
        let siqsSum = 0;
        let siqsCount = 0;
        
        clusterPoints.forEach(p => {
          if (p.siqs !== undefined && p.siqs !== null) {
            siqsSum += parseFloat(formatSiqsScore(p.siqs));
            siqsCount++;
          }
        });
        
        const averageSiqs = siqsCount > 0 ? siqsSum / siqsCount : 0;
        
        clusters.push({
          center: [
            latSum / clusterPoints.length,
            lonSum / clusterPoints.length
          ],
          count: clusterPoints.length,
          averageSiqs,
          points: clusterPoints
        });
      } else {
        // If no nearby points, add as a single point
        singlePoints.push(point);
        processedPoints.add(i);
      }
    }
    
    return { clusters, singlePoints };
  }
}
