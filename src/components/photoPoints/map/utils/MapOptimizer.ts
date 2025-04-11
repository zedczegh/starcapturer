
import L, { Icon, Marker } from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Manager for optimizing map marker rendering
 * Uses clustering, render throttling, and visibility checks
 */
export class MapOptimizer {
  private visibleMarkers: Map<string, Marker> = new Map();
  private markerCluster: L.MarkerClusterGroup | null = null;
  private map: L.Map | null = null;
  private renderTimeout: NodeJS.Timeout | null = null;
  private activeView: 'certified' | 'calculated' = 'certified';
  
  constructor() {
    this.visibleMarkers = new Map();
  }
  
  /**
   * Initialize with the Leaflet map instance
   */
  public initialize(map: L.Map): void {
    this.map = map;
    
    // Create a marker cluster group if not exists
    if (!this.markerCluster && map) {
      // Check if MarkerClusterGroup is available
      if (L.MarkerClusterGroup) {
        this.markerCluster = L.markerClusterGroup({
          maxClusterRadius: 40,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          chunkedLoading: true,
          chunkProgress: (processed, total) => {
            console.log(`Processed ${processed} of ${total} markers`);
          }
        });
        
        this.markerCluster.addTo(map);
      }
    }
    
    // Add viewport change listeners
    map.on('moveend', () => this.refreshVisibleMarkers());
    map.on('zoomend', () => this.refreshVisibleMarkers());
  }
  
  /**
   * Set the active view type
   */
  public setActiveView(view: 'certified' | 'calculated'): void {
    if (this.activeView !== view) {
      this.activeView = view;
      this.clearMarkers();
    }
  }
  
  /**
   * Update markers with new location data
   */
  public updateMarkers(locations: SharedAstroSpot[], selectedId?: string): void {
    if (!this.map) return;
    
    // Throttle rendering to prevent performance issues
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
    }
    
    this.renderTimeout = setTimeout(() => {
      this.renderMarkersThrottled(locations, selectedId);
    }, 50);
  }
  
  /**
   * Actually render the markers with throttling
   */
  private renderMarkersThrottled(locations: SharedAstroSpot[], selectedId?: string): void {
    if (!this.map) return;
    
    console.log(`Rendering ${locations.length} optimized markers for ${this.activeView} view`);
    
    // Get current bounds
    const bounds = this.map.getBounds();
    
    // Get existing marker IDs
    const existingIds = new Set(this.visibleMarkers.keys());
    
    // Track which markers we've processed
    const processedIds = new Set<string>();
    
    // Process in chunks for smoother rendering
    const chunkSize = 50;
    let index = 0;
    
    const processNextChunk = () => {
      if (index >= locations.length) {
        // Remove markers that no longer exist
        existingIds.forEach(id => {
          if (!processedIds.has(id)) {
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
        });
        return;
      }
      
      const endIndex = Math.min(index + chunkSize, locations.length);
      
      for (let i = index; i < endIndex; i++) {
        const location = locations[i];
        const id = location.id || `loc-${location.latitude}-${location.longitude}`;
        processedIds.add(id);
        
        // Check if marker is within visible bounds
        if (location.latitude && location.longitude) {
          const latLng = L.latLng(location.latitude, location.longitude);
          
          // Only create/update markers if they're visible or near visible area
          if (this.isMarkerInBounds(latLng, bounds)) {
            // If marker already exists, update it
            if (this.visibleMarkers.has(id)) {
              const marker = this.visibleMarkers.get(id)!;
              marker.setLatLng(latLng);
              // Update tooltip or popup if needed
            } else {
              // Create new marker
              const marker = this.createMarker(location, id === selectedId);
              this.visibleMarkers.set(id, marker);
              
              // Add to cluster if available, otherwise to map
              if (this.markerCluster) {
                this.markerCluster.addLayer(marker);
              } else {
                marker.addTo(this.map!);
              }
            }
          }
        }
      }
      
      index = endIndex;
      setTimeout(processNextChunk, 0);
    };
    
    // Start processing
    processNextChunk();
  }
  
  /**
   * Check if marker is within or near visible bounds
   * Includes a small buffer around visible area to prevent pop-in
   */
  private isMarkerInBounds(latLng: L.LatLng, bounds: L.LatLngBounds): boolean {
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
   * Create a marker for a location
   */
  private createMarker(location: SharedAstroSpot, isSelected: boolean): L.Marker {
    const isCertified = location.isDarkSkyReserve || location.certification;
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
  private getMarkerIcon(isCertified: boolean, siqs: number, isSelected: boolean): Icon {
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
   * Refresh visible markers based on map bounds
   */
  private refreshVisibleMarkers(): void {
    if (!this.map) return;
    // The updateMarkers method will handle this when called
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
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
    }
    
    this.clearMarkers();
    
    if (this.map) {
      this.map.off('moveend');
      this.map.off('zoomend');
    }
    
    this.map = null;
    this.markerCluster = null;
  }
}

// Export singleton instance
export const mapOptimizer = new MapOptimizer();
