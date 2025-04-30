
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getLocationMarker } from '../../MarkerUtils';
import { getSiqsScore } from '@/utils/siqsHelpers';

/**
 * Manages map markers for photo points with optimized rendering
 */
export class MarkerManager {
  private markers: Map<string, L.Marker> = new Map();
  private map: L.Map | null = null;
  private selectedMarkerId: string | null = null;
  
  /**
   * Initialize the manager with a Leaflet map
   */
  public initialize(map: L.Map): void {
    this.map = map;
  }
  
  /**
   * Clear all markers from the map
   */
  public clearMarkers(): void {
    if (!this.map) return;
    
    this.markers.forEach(marker => {
      marker.remove();
    });
    
    this.markers.clear();
    this.selectedMarkerId = null;
  }
  
  /**
   * Render markers for locations
   * 
   * @param locations - Array of locations to render
   * @param selectedId - Optional ID of selected location
   * @param visibleBounds - Optional bounds to filter visible locations
   */
  public renderMarkers(
    locations: SharedAstroSpot[], 
    selectedId?: string,
    visibleBounds?: L.LatLngBounds
  ): void {
    if (!this.map) return;
    
    const currentMarkerIds = new Set<string>();
    
    // Process each location
    locations.forEach(location => {
      if (!location.latitude || !location.longitude) return;
      
      // Create a unique ID for each location
      const markerId = `marker-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
      currentMarkerIds.add(markerId);
      
      // If marker already exists, update it if needed
      if (this.markers.has(markerId)) {
        const existingMarker = this.markers.get(markerId)!;
        
        // Update marker if it's now selected or was previously selected
        if ((selectedId && markerId === `marker-${selectedId}`) || 
            (this.selectedMarkerId && markerId === this.selectedMarkerId)) {
          existingMarker.setIcon(this.createMarkerIcon(location, true));
        }
        
        return;
      }
      
      // Skip rendering markers outside visible bounds to improve performance
      if (visibleBounds && !visibleBounds.contains(L.latLng(location.latitude, location.longitude))) {
        return;
      }
      
      // Determine if this is the selected marker
      const isSelected = selectedId && markerId === `marker-${selectedId}`;
      if (isSelected) {
        this.selectedMarkerId = markerId;
      }
      
      // Create marker with location-specific icon
      const marker = L.marker(
        [location.latitude, location.longitude],
        {
          icon: this.createMarkerIcon(location, isSelected),
          riseOnHover: true
        }
      );
      
      // Add popup with location information if needed
      if (location.name) {
        const popupContent = `
          <div class="text-sm font-semibold">${location.name}</div>
          ${location.description ? `<div class="text-xs mt-1">${location.description}</div>` : ''}
          ${location.siqs ? `<div class="text-xs mt-1 font-medium">SIQS: ${getSiqsScore(location.siqs).toFixed(1)}</div>` : ''}
        `;
        marker.bindPopup(popupContent);
      }
      
      // Add marker to map and collection
      marker.addTo(this.map);
      this.markers.set(markerId, marker);
    });
    
    // Remove markers that are no longer in the locations array
    this.markers.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.remove();
        this.markers.delete(id);
      }
    });
  }
  
  /**
   * Create a marker icon based on location properties
   */
  private createMarkerIcon(location: SharedAstroSpot, isSelected: boolean): L.Icon {
    const isCertified = Boolean(location.certification || location.isDarkSkyReserve);
    return getLocationMarker(location, isCertified, isSelected, false);
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    this.clearMarkers();
    this.map = null;
  }
}
