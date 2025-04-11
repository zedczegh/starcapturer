
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Handles spatial operations for map markers
 */
export class SpatialFilter {
  private minimumDistance: number = 2; // Minimum distance in km between calculated spots
  private filterDistanceMap: Map<string, boolean> = new Map();
  
  /**
   * Apply distance-based filtering to calculated locations
   * Ensures spots aren't too close to each other for better map readability
   */
  public filterByDistance(locations: SharedAstroSpot[], activeView: 'certified' | 'calculated'): SharedAstroSpot[] {
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
    calculated.sort((a, b) => (b.siqs || 0) - (a.siqs || 0));
    
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
   * Check if marker is within or near visible bounds
   * Includes a small buffer around visible area to prevent pop-in
   */
  public isMarkerInBounds(latLng: L.LatLng, bounds: L.LatLngBounds): boolean {
    // Add padding to bounds
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const latPadding = (ne.lat - sw.lat) * 0.2; // 20% padding
    const lngPadding = (ne.lng - sw.lng) * 0.2;
    
    const paddedBounds = L.latLngBounds(
      L.latLng(sw.lat - latPadding, sw.lng - lngPadding),
      L.latLng(ne.lat + latPadding, ne.lng + lngPadding)
    );
    
    return paddedBounds.contains(latLng);
  }
  
  /**
   * Helper to calculate distance between two points
   */
  public calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export const spatialFilter = new SpatialFilter();
