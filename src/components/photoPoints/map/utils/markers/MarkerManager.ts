
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * MarkerManager class for handling map marker operations
 */
class MarkerManager {
  private markers: Map<string, L.Marker> = new Map();
  private markerLayer: L.LayerGroup | null = null;
  private map: L.Map | null = null;
  
  /**
   * Initialize the marker manager with a map
   */
  initialize(map: L.Map) {
    this.map = map;
    this.markerLayer = L.layerGroup().addTo(map);
    return this;
  }
  
  /**
   * Create a marker for a location
   */
  createMarker(location: SharedAstroSpot, icon: L.Icon): L.Marker {
    if (!location.latitude || !location.longitude) {
      throw new Error('Invalid location coordinates');
    }
    
    const marker = L.marker([location.latitude, location.longitude], { icon });
    const locationId = location.id || `${location.latitude}-${location.longitude}`;
    
    this.markers.set(locationId, marker);
    
    if (this.markerLayer) {
      marker.addTo(this.markerLayer);
    }
    
    return marker;
  }
  
  /**
   * Get a marker by location ID
   */
  getMarker(locationId: string): L.Marker | undefined {
    return this.markers.get(locationId);
  }
  
  /**
   * Remove a marker by location ID
   */
  removeMarker(locationId: string): boolean {
    const marker = this.markers.get(locationId);
    
    if (marker && this.markerLayer) {
      this.markerLayer.removeLayer(marker);
      this.markers.delete(locationId);
      return true;
    }
    
    return false;
  }
  
  /**
   * Clear all markers
   */
  clearMarkers(): void {
    if (this.markerLayer) {
      this.markerLayer.clearLayers();
    }
    this.markers.clear();
  }
  
  /**
   * Update marker icon
   */
  updateMarkerIcon(locationId: string, icon: L.Icon): boolean {
    const marker = this.markers.get(locationId);
    
    if (marker) {
      marker.setIcon(icon);
      return true;
    }
    
    return false;
  }
  
  /**
   * Get all markers
   */
  getAllMarkers(): L.Marker[] {
    return Array.from(this.markers.values());
  }
  
  /**
   * Destroy the manager
   */
  destroy(): void {
    if (this.markerLayer && this.map) {
      this.map.removeLayer(this.markerLayer);
    }
    
    this.markers.clear();
    this.markerLayer = null;
    this.map = null;
  }
}

export default MarkerManager;
