
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';

// Marker type definitions
export enum MarkerType {
  USER_LOCATION = 'userLocation',
  CERTIFIED = 'certified',
  OBSERVATION = 'observation',
  FORECAST = 'forecast',
  STANDARD = 'standard'
}

export interface CustomMarker {
  id: string;
  type: MarkerType;
  location: SharedAstroSpot;
  marker: L.Marker;
}

class MarkerManager {
  private markers: Map<string, CustomMarker> = new Map();
  private hoveredMarkerId: string | null = null;
  
  /**
   * Create a marker for a location
   * @param location Location data
   * @param options Additional marker options
   * @returns Marker instance
   */
  createMarker(location: SharedAstroSpot, options: {
    type?: MarkerType;
    isHovered?: boolean;
    onClick?: (location: SharedAstroSpot) => void;
    onHover?: (id: string) => void;
    onMouseOut?: (id: string | null) => void;
  } = {}): CustomMarker {
    const {
      type = MarkerType.STANDARD,
      isHovered = false,
      onClick,
      onHover,
      onMouseOut
    } = options;
    
    // Create a unique ID for the marker
    const id = location.id || `marker-${type}-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
    
    // Check if marker already exists
    if (this.markers.has(id)) {
      const existingMarker = this.markers.get(id)!;
      
      // Update marker if needed
      if (isHovered) {
        this.highlightMarker(existingMarker);
      } else if (this.hoveredMarkerId === id) {
        this.unhighlightMarker(existingMarker);
      }
      
      return existingMarker;
    }
    
    // Generate marker icon based on type and SIQS score
    const icon = this.createMarkerIcon(location, type, isHovered);
    
    // Create marker instance
    const marker = L.marker([location.latitude, location.longitude], { icon });
    
    // Create custom marker object
    const customMarker: CustomMarker = {
      id,
      type,
      location,
      marker
    };
    
    // Add event handlers
    if (onClick) {
      marker.on('click', () => onClick(location));
    }
    
    if (onHover) {
      marker.on('mouseover', () => onHover(id));
    }
    
    if (onMouseOut) {
      marker.on('mouseout', () => onMouseOut(null));
    }
    
    // Store marker in collection
    this.markers.set(id, customMarker);
    
    return customMarker;
  }
  
  /**
   * Create marker icon based on location type and SIQS score
   * @param location Location data
   * @param type Marker type
   * @param isHovered Whether marker is currently hovered
   * @returns L.DivIcon instance
   */
  private createMarkerIcon(location: SharedAstroSpot, type: MarkerType, isHovered: boolean): L.DivIcon {
    const siqsScore = getSiqsScore(location.siqs);
    const qualityClass = siqsScore > 7 ? 'high-quality' : siqsScore > 5 ? 'medium-quality' : 'low-quality';
    
    switch (type) {
      case MarkerType.USER_LOCATION:
        return L.divIcon({
          className: 'user-location-marker',
          html: `<div class="user-location-marker-inner ${isHovered ? 'hovered' : ''}"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });
        
      case MarkerType.CERTIFIED:
        return L.divIcon({
          className: `certified-marker ${qualityClass}`,
          html: `<div class="certified-marker-inner ${isHovered ? 'hovered' : ''}"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        
      case MarkerType.FORECAST:
        return L.divIcon({
          className: `forecast-marker ${qualityClass}`,
          html: `<div class="forecast-marker-inner ${isHovered ? 'hovered' : ''}">
            <div class="forecast-marker-label">${siqsScore.toFixed(1)}</div>
          </div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        
      default:
        return L.divIcon({
          className: `location-marker ${qualityClass}`,
          html: `<div class="location-marker-inner ${isHovered ? 'hovered' : ''}"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
    }
  }
  
  /**
   * Highlight a marker
   * @param marker Marker to highlight
   */
  highlightMarker(marker: CustomMarker): void {
    // Update hover state
    this.hoveredMarkerId = marker.id;
    
    // Generate new icon with hover state
    const newIcon = this.createMarkerIcon(marker.location, marker.type, true);
    marker.marker.setIcon(newIcon);
    
    // Bring to front
    marker.marker.setZIndexOffset(1000);
  }
  
  /**
   * Remove highlight from a marker
   * @param marker Marker to unhighlight
   */
  unhighlightMarker(marker: CustomMarker): void {
    // Clear hover state if this is the currently hovered marker
    if (this.hoveredMarkerId === marker.id) {
      this.hoveredMarkerId = null;
    }
    
    // Generate new icon without hover state
    const newIcon = this.createMarkerIcon(marker.location, marker.type, false);
    marker.marker.setIcon(newIcon);
    
    // Reset z-index
    marker.marker.setZIndexOffset(0);
  }
  
  /**
   * Remove a marker from the map and collection
   * @param id Marker ID to remove
   */
  removeMarker(id: string): void {
    const marker = this.markers.get(id);
    if (marker) {
      marker.marker.remove();
      this.markers.delete(id);
      
      if (this.hoveredMarkerId === id) {
        this.hoveredMarkerId = null;
      }
    }
  }
  
  /**
   * Clear all markers
   */
  clearMarkers(): void {
    this.markers.forEach(marker => {
      marker.marker.remove();
    });
    this.markers.clear();
    this.hoveredMarkerId = null;
  }
  
  /**
   * Get a marker by ID
   * @param id Marker ID
   * @returns Marker or undefined if not found
   */
  getMarker(id: string): CustomMarker | undefined {
    return this.markers.get(id);
  }
  
  /**
   * Get all markers
   * @returns Array of all markers
   */
  getAllMarkers(): CustomMarker[] {
    return Array.from(this.markers.values());
  }
}

export default new MarkerManager();
