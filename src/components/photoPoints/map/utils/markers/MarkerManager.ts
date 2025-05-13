
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { getLocationMarker, isValidAstronomyLocation } from '../../MarkerUtils';
import { isWaterLocation } from '@/utils/validation';

/**
 * Manager for map markers with optimized rendering
 */
export class MarkerManager {
  private map: L.Map | null = null;
  private markers: Map<string, L.Marker> = new Map();
  private selectedMarkerId: string | null = null;
  
  /**
   * Initialize with map instance
   */
  public initialize(map: L.Map): void {
    this.map = map;
  }
  
  /**
   * Render markers on the map with optimizations
   * Only render markers in the current view bounds
   */
  public renderMarkers(
    locations: SharedAstroSpot[],
    selectedId?: string,
    bounds?: L.LatLngBounds
  ): void {
    if (!this.map) return;
    
    // Update selected marker ID
    this.selectedMarkerId = selectedId || null;
    
    // Get current map bounds if not provided
    const mapBounds = bounds || this.map.getBounds();
    
    // Track which markers we've processed in this render
    const processedMarkerIds = new Set<string>();
    
    // Process all locations
    for (const location of locations) {
      // Skip invalid locations
      if (!isValidAstronomyLocation(location.latitude, location.longitude)) {
        continue;
      }
      
      // Create a unique ID for this marker
      const markerId = `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
      
      // Track that we've processed this marker
      processedMarkerIds.add(markerId);
      
      // Check if marker is already on the map
      const existingMarker = this.markers.get(markerId);
      
      // If marker exists and location data is the same, skip re-rendering
      if (existingMarker) {
        // Update popup content if needed
        // Skip for performance reasons, handled by click events instead
        continue;
      }
      
      // Check if location is in current viewport
      const isInBounds = mapBounds.contains(L.latLng(location.latitude, location.longitude));
      
      // Skip markers outside viewport for performance
      if (!isInBounds) {
        continue;
      }
      
      // Determine if this is a certified location
      const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
      
      // Skip rendering water locations if not certified
      if (!isCertified && isWaterLocation(location.latitude, location.longitude, false)) {
        continue;
      }
      
      // Create marker icon based on location data
      const marker = L.marker([location.latitude, location.longitude], {
        icon: getLocationMarker(location, isCertified, false, false),
      });
      
      // Add to map
      marker.addTo(this.map);
      
      // Store marker reference
      this.markers.set(markerId, marker);
    }
    
    // Clean up markers that are no longer in the locations array
    for (const [markerId, marker] of this.markers.entries()) {
      if (!processedMarkerIds.has(markerId)) {
        this.map.removeLayer(marker);
        this.markers.delete(markerId);
      }
    }
  }
  
  /**
   * Clear all markers from the map
   */
  public clearMarkers(): void {
    if (!this.map) return;
    
    // Remove all markers from map
    for (const marker of this.markers.values()) {
      this.map.removeLayer(marker);
    }
    
    // Clear markers collection
    this.markers.clear();
  }
  
  /**
   * Highlight a specific marker
   */
  public highlightMarker(markerId: string): void {
    // Implementation omitted for brevity
    // Would change the icon to a highlighted version
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    this.clearMarkers();
    this.map = null;
  }
}
