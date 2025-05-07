
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getLocationMarker } from '../../MarkerUtils';

/**
 * Manager for handling map markers efficiently
 */
export class MarkerManager {
  private map: L.Map | null = null;
  private markers: Map<string, L.Marker> = new Map();
  private visibleMarkers: Set<string> = new Set();

  /**
   * Initialize with the Leaflet map instance
   */
  public initialize(map: L.Map): void {
    this.map = map;
  }

  /**
   * Render markers for locations
   * @param locations Array of locations to render
   * @param selectedId Optional ID of selected location
   * @param bounds Optional map bounds for optimization
   */
  public renderMarkers(
    locations: SharedAstroSpot[],
    selectedId?: string,
    bounds?: L.LatLngBounds
  ): void {
    if (!this.map) return;

    // Track which markers should remain visible
    const newVisibleMarkers = new Set<string>();
    
    // Create or update markers for each location
    locations.forEach(location => {
      if (!location.latitude || !location.longitude) return;
      
      // Skip locations outside the visible bounds
      if (bounds && !bounds.contains([location.latitude, location.longitude])) {
        return;
      }
      
      const locationId = location.id || `${location.latitude}-${location.longitude}`;
      newVisibleMarkers.add(locationId);
      
      // Check if marker already exists
      if (this.markers.has(locationId)) {
        // Update existing marker if needed
        const marker = this.markers.get(locationId)!;
        
        // Update position if needed
        const currentPos = marker.getLatLng();
        if (currentPos.lat !== location.latitude || currentPos.lng !== location.longitude) {
          marker.setLatLng([location.latitude, location.longitude]);
        }
        
        // Ensure marker is on the map
        if (!marker.getMap()) {
          marker.addTo(this.map);
        }
      } else {
        // Create new marker
        this.createMarker(location, locationId, selectedId === locationId);
      }
    });
    
    // Remove markers that are no longer visible
    this.visibleMarkers.forEach(id => {
      if (!newVisibleMarkers.has(id)) {
        const marker = this.markers.get(id);
        if (marker) {
          marker.remove();
        }
      }
    });
    
    // Update visible markers
    this.visibleMarkers = newVisibleMarkers;
  }
  
  /**
   * Create a new marker for a location
   */
  private createMarker(
    location: SharedAstroSpot,
    locationId: string,
    isSelected: boolean
  ): void {
    if (!this.map) return;
    
    // Determine if location is certified
    const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
    
    // Create marker with appropriate icon
    const marker = L.marker(
      [location.latitude, location.longitude],
      {
        icon: getLocationMarker(location, isCertified, isSelected, false)
      }
    );
    
    // Add to map and store in collection
    marker.addTo(this.map);
    this.markers.set(locationId, marker);
  }
  
  /**
   * Clear all markers
   */
  public clearMarkers(): void {
    this.markers.forEach(marker => {
      marker.remove();
    });
    this.markers.clear();
    this.visibleMarkers.clear();
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    this.clearMarkers();
    this.map = null;
  }
}
