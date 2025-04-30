
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import L from 'leaflet';

/**
 * Manages marker creation, updates, and cleanup for map components
 */
class MarkerManager {
  private markers: Map<string, L.Marker> = new Map();
  private map: L.Map | null = null;
  
  /**
   * Set the map instance for this marker manager
   */
  setMap(map: L.Map): void {
    this.map = map;
  }
  
  /**
   * Create markers for all locations and add them to the map
   */
  createMarkers(
    locations: SharedAstroSpot[],
    createMarkerFn: (location: SharedAstroSpot) => L.Marker
  ): void {
    if (!this.map) return;
    
    // Clear existing markers
    this.clearMarkers();
    
    // Create new markers
    locations.forEach(location => {
      const marker = createMarkerFn(location);
      
      if (marker) {
        const key = this.getLocationKey(location);
        this.markers.set(key, marker);
        marker.addTo(this.map!);
      }
    });
  }
  
  /**
   * Update existing markers based on new locations
   */
  updateMarkers(
    locations: SharedAstroSpot[],
    createMarkerFn: (location: SharedAstroSpot) => L.Marker
  ): void {
    if (!this.map) return;
    
    // Track which markers should be removed
    const existingKeys = new Set(this.markers.keys());
    
    // Update or add markers for each location
    locations.forEach(location => {
      const key = this.getLocationKey(location);
      existingKeys.delete(key);
      
      // Update or create marker
      if (this.markers.has(key)) {
        // Update existing marker if needed
        const existingMarker = this.markers.get(key);
        existingMarker?.setLatLng([location.latitude, location.longitude]);
      } else {
        // Create new marker
        const marker = createMarkerFn(location);
        if (marker) {
          this.markers.set(key, marker);
          marker.addTo(this.map!);
        }
      }
    });
    
    // Remove any markers that are no longer needed
    existingKeys.forEach(key => {
      const marker = this.markers.get(key);
      if (marker) {
        marker.remove();
        this.markers.delete(key);
      }
    });
  }
  
  /**
   * Remove all markers from the map and clear the markers collection
   */
  clearMarkers(): void {
    this.markers.forEach(marker => {
      marker.remove();
    });
    this.markers.clear();
  }
  
  /**
   * Get a unique key for a location to use in the markers map
   */
  private getLocationKey(location: SharedAstroSpot): string {
    return location.id || `${location.latitude}-${location.longitude}`;
  }
  
  /**
   * Get number of active markers
   */
  getMarkerCount(): number {
    return this.markers.size;
  }
  
  /**
   * Check if a marker exists for a location
   */
  hasMarker(location: SharedAstroSpot): boolean {
    const key = this.getLocationKey(location);
    return this.markers.has(key);
  }
  
  /**
   * Get a marker for a location if it exists
   */
  getMarker(location: SharedAstroSpot): L.Marker | undefined {
    const key = this.getLocationKey(location);
    return this.markers.get(key);
  }
}

// Export the MarkerManager class as default
export default MarkerManager;
