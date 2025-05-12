
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Handles filtering of map locations based on distance and other criteria
 */
export class LocationFilter {
  private filterDistanceMap: Map<string, boolean> = new Map();
  private minimumDistance: number = 2; // Minimum distance in km between calculated spots
  
  /**
   * Reset distance filtering state
   */
  public resetDistanceFilters(): void {
    this.filterDistanceMap.clear();
  }
  
  /**
   * Apply distance-based filtering to calculated locations
   * Ensures spots aren't too close to each other for better map readability
   */
  public filterByDistance(
    locations: SharedAstroSpot[], 
    activeView: 'certified' | 'calculated'
  ): SharedAstroSpot[] {
    // Don't apply filtering to certified locations
    if (activeView === 'certified') {
      return locations;
    }
    
    // Reset filter map when processing a new batch
    this.filterDistanceMap.clear();
    
    // First prioritize certified locations (they're never filtered)
    const certified: SharedAstroSpot[] = [];
    const calculated: SharedAstroSpot[] = [];
    
    // Split locations into certified and calculated
    locations.forEach(loc => {
      if (loc.isDarkSkyReserve || loc.certification) {
        certified.push(loc);
      } else {
        calculated.push(loc);
      }
    });
    
    // Sort calculated by SIQS score (highest first)
    calculated.sort((a, b) => {
      const scoreA = typeof a.siqs === 'object' ? a.siqs.score : (a.siqs || 0);
      const scoreB = typeof b.siqs === 'object' ? b.siqs.score : (b.siqs || 0);
      return scoreB - scoreA;
    });
    
    // Apply distance filter to calculated spots only
    const filteredCalculated: SharedAstroSpot[] = [];
    
    for (const location of calculated) {
      const key = `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
      
      // Check if this location is too close to any already-added location
      let isTooClose = false;
      
      for (const addedLoc of [...certified, ...filteredCalculated]) {
        const distance = this.calculateDistance(
          location.latitude, location.longitude,
          addedLoc.latitude, addedLoc.longitude
        );
        
        // Skip if too close to an existing location
        if (distance < this.minimumDistance) {
          isTooClose = true;
          break;
        }
      }
      
      if (!isTooClose) {
        filteredCalculated.push(location);
        this.filterDistanceMap.set(key, true);
      }
    }
    
    // Combine certified (all) with filtered calculated
    return [...certified, ...filteredCalculated];
  }
  
  /**
   * Helper to calculate distance between two points
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }
  
  /**
   * Convert degrees to radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}
