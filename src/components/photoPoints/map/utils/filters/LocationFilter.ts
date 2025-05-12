
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Manages filtering of locations based on various criteria
 */
export class LocationFilter {
  private distanceThresholds: Map<string, number> = new Map();

  constructor() {
    // Initialize with default distance thresholds
    this.resetDistanceFilters();
  }

  /**
   * Reset distance thresholds to defaults
   */
  public resetDistanceFilters(): void {
    this.distanceThresholds.clear();
    
    // Default distance thresholds for each zoom level and view type
    this.distanceThresholds.set('certified', 0); // No distance filtering for certified
    this.distanceThresholds.set('calculated', 1.0); // 1km for calculated view
  }

  /**
   * Filter locations based on distance between them
   * Used to avoid too many markers in a small area
   */
  public filterByDistance(
    locations: SharedAstroSpot[],
    activeView: 'certified' | 'calculated'
  ): SharedAstroSpot[] {
    // For certified view, don't apply distance filtering
    if (activeView === 'certified') {
      return locations;
    }
    
    // Get threshold for current view
    const threshold = this.distanceThresholds.get(activeView) || 0;
    
    // If no threshold defined, return all
    if (threshold <= 0) {
      return locations;
    }
    
    // Apply distance filtering
    const filtered: SharedAstroSpot[] = [];
    const thresholdSquared = threshold * threshold;
    
    // Sort by certification first, then by SIQS score
    const sorted = [...locations].sort((a, b) => {
      // Certified always first
      const aIsCertified = Boolean(a.isDarkSkyReserve || a.certification);
      const bIsCertified = Boolean(b.isDarkSkyReserve || b.certification);
      
      if (aIsCertified && !bIsCertified) return -1;
      if (!aIsCertified && bIsCertified) return 1;
      
      // Then by SIQS score
      const aSiqs = typeof a.siqs === 'number' ? a.siqs : 
                   (a.siqs && typeof a.siqs === 'object' && 'score' in a.siqs) ? a.siqs.score : 0;
                   
      const bSiqs = typeof b.siqs === 'number' ? b.siqs : 
                   (b.siqs && typeof b.siqs === 'object' && 'score' in b.siqs) ? b.siqs.score : 0;
                   
      return bSiqs - aSiqs;
    });
    
    // Process in priority order
    for (const location of sorted) {
      // Always include certified locations
      if (location.isDarkSkyReserve || location.certification) {
        filtered.push(location);
        continue;
      }
      
      // Check if this location is too close to any existing filtered location
      let tooClose = false;
      
      for (const existing of filtered) {
        const distance = this.calculateDistanceSquared(
          location.latitude,
          location.longitude,
          existing.latitude,
          existing.longitude
        );
        
        if (distance < thresholdSquared) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        filtered.push(location);
      }
    }
    
    return filtered;
  }
  
  /**
   * Calculate squared distance between two points
   * More efficient than calculating actual distance for comparisons
   */
  private calculateDistanceSquared(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    // Quick approximation for small distances
    const latDiff = (lat1 - lat2) * 111.32; // km per degree latitude
    const lngDiff = (lng1 - lng2) * 111.32 * Math.cos(lat1 * Math.PI / 180);
    return (latDiff * latDiff) + (lngDiff * lngDiff);
  }
}
