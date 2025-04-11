
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { markerManager } from './marker/MarkerManager';
import { spatialFilter } from './spatial/SpatialFilter';

/**
 * Manager for optimizing map marker rendering
 * Uses clustering, render throttling, and visibility checks
 */
export class MapOptimizer {
  private map: L.Map | null = null;
  private renderTimeout: NodeJS.Timeout | null = null;
  private activeView: 'certified' | 'calculated' = 'certified';
  
  /**
   * Initialize with the Leaflet map instance
   */
  public initialize(map: L.Map): void {
    this.map = map;
    
    // Create a marker cluster group if not exists
    if (map && L.MarkerClusterGroup) {
      const markerCluster = L.MarkerClusterGroup({
        maxClusterRadius: 40,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        chunkedLoading: true,
        chunkProgress: (processed, total) => {
          console.log(`Processed ${processed} of ${total} markers`);
        }
      });
      
      markerCluster.addTo(map);
      markerManager.setMarkerCluster(markerCluster);
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
      // Apply distance filtering to locations
      const filteredLocations = spatialFilter.filterByDistance(locations, this.activeView);
      this.renderMarkersThrottled(filteredLocations, selectedId);
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
    const existingIds = new Set(markerManager.getVisibleMarkers().keys());
    
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
            markerManager.removeMarker(id);
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
          if (spatialFilter.isMarkerInBounds(latLng, bounds)) {
            // If marker already exists, update it
            if (markerManager.getVisibleMarkers().has(id)) {
              const marker = markerManager.getVisibleMarkers().get(id)!;
              marker.setLatLng(latLng);
            } else {
              // Create new marker
              const marker = markerManager.createMarker(location, id === selectedId);
              markerManager.addToMap(id, marker, this.map);
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
    markerManager.clearMarkers();
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
  }
}

// Export singleton instance
export const mapOptimizer = new MapOptimizer();
