
import L, { Icon, Marker } from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Handles marker creation, positioning, and icons
 */
export class MarkerManager {
  private visibleMarkers: Map<string, Marker> = new Map();
  private markerCluster: L.MarkerClusterGroup | null = null;
  
  constructor() {
    this.visibleMarkers = new Map();
  }
  
  /**
   * Initialize with a marker cluster group
   */
  public setMarkerCluster(markerCluster: L.MarkerClusterGroup): void {
    this.markerCluster = markerCluster;
  }
  
  /**
   * Create a marker for a location
   */
  public createMarker(location: SharedAstroSpot, isSelected: boolean): L.Marker {
    const isCertified = location.isDarkSkyReserve === true || (typeof location.certification === 'string' && location.certification !== '');
    const siqs = location.siqs || 0;
    
    // Choose icon based on location type
    const icon = this.getMarkerIcon(isCertified, siqs, isSelected);
    
    // Create the marker
    const marker = L.marker([location.latitude, location.longitude], { icon });
    
    // Add tooltip
    marker.bindTooltip(`${location.name || 'Unknown Location'} (SIQS: ${siqs.toFixed(1)})`);
    
    return marker;
  }
  
  /**
   * Get appropriate icon based on location type
   */
  public getMarkerIcon(isCertified: boolean, siqs: number, isSelected: boolean): Icon {
    // Default icon properties
    let iconUrl = '/markers/marker-default.svg';
    let iconSize: [number, number] = [30, 30];
    
    // Select icon based on location type and SIQS
    if (isCertified) {
      iconUrl = '/markers/marker-certified.svg';
      iconSize = [36, 36];
    } else if (siqs >= 8) {
      iconUrl = '/markers/marker-excellent.svg';
    } else if (siqs >= 6) {
      iconUrl = '/markers/marker-good.svg';
    } else if (siqs >= 4) {
      iconUrl = '/markers/marker-average.svg';
    } else {
      iconUrl = '/markers/marker-poor.svg';
    }
    
    // Use selected icon if selected
    if (isSelected) {
      iconUrl = '/markers/marker-selected.svg';
      iconSize = [40, 40];
    }
    
    return L.icon({
      iconUrl,
      iconSize,
      iconAnchor: [iconSize[0] / 2, iconSize[1]],
      popupAnchor: [0, -iconSize[1]]
    });
  }
  
  /**
   * Add a marker to the map or cluster
   */
  public addToMap(id: string, marker: L.Marker, map: L.Map): void {
    this.visibleMarkers.set(id, marker);
    
    // Add to cluster if available, otherwise to map
    if (this.markerCluster) {
      this.markerCluster.addLayer(marker);
    } else {
      marker.addTo(map);
    }
  }
  
  /**
   * Remove a marker from the map
   */
  public removeMarker(id: string): void {
    const marker = this.visibleMarkers.get(id);
    if (marker) {
      if (this.markerCluster) {
        this.markerCluster.removeLayer(marker);
      } else {
        marker.remove();
      }
      this.visibleMarkers.delete(id);
    }
  }
  
  /**
   * Get all currently visible markers
   */
  public getVisibleMarkers(): Map<string, Marker> {
    return this.visibleMarkers;
  }
  
  /**
   * Clear all markers
   */
  public clearMarkers(): void {
    // Clear marker cluster if available
    if (this.markerCluster) {
      this.markerCluster.clearLayers();
    }
    
    // Clear visible markers map
    this.visibleMarkers.clear();
  }
}

export const markerManager = new MarkerManager();
