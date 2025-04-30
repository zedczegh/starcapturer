
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Manages markers on the map for better performance
 */
export default class MarkerManager {
  private markers: Map<string, L.Marker> = new Map();
  private activeMarkers: Set<string> = new Set();
  
  /**
   * Add or update a marker on the map
   * @param id Unique identifier for the marker
   * @param marker The Leaflet marker
   */
  addMarker(id: string, marker: L.Marker): void {
    this.markers.set(id, marker);
    this.activeMarkers.add(id);
  }
  
  /**
   * Remove a marker from the map
   * @param id Marker identifier
   */
  removeMarker(id: string): void {
    this.markers.delete(id);
    this.activeMarkers.delete(id);
  }
  
  /**
   * Check if a marker exists
   * @param id Marker identifier
   */
  hasMarker(id: string): boolean {
    return this.markers.has(id);
  }
  
  /**
   * Get a marker by id
   * @param id Marker identifier
   */
  getMarker(id: string): L.Marker | undefined {
    return this.markers.get(id);
  }
  
  /**
   * Update marker position
   * @param id Marker identifier
   * @param position New position
   */
  updateMarkerPosition(id: string, position: L.LatLngExpression): void {
    const marker = this.markers.get(id);
    if (marker) {
      marker.setLatLng(position);
    }
  }
  
  /**
   * Clear all markers
   */
  clearMarkers(): void {
    this.markers.clear();
    this.activeMarkers.clear();
  }
  
  /**
   * Get all marker ids
   */
  getAllMarkerIds(): string[] {
    return Array.from(this.markers.keys());
  }
  
  /**
   * Get count of active markers
   */
  getActiveCount(): number {
    return this.activeMarkers.size;
  }
}
