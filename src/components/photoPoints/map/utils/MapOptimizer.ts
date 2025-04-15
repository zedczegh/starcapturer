import L, { Icon, Marker } from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore, formatSiqsScore } from '@/utils/siqsHelpers';

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
  private filterDistanceMap: Map<string, boolean> = new Map();
  private minimumDistance: number = 2; // Minimum distance in km between calculated spots
  
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
        this.markerCluster = L.MarkerClusterGroup({
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
      this.filterDistanceMap.clear(); // Reset distance filtering when view changes
    }
  }
  
  /**
   * Apply distance-based filtering to calculated locations
   * Ensures spots aren't too close to each other for better map readability
   */
  private filterByDistance(locations: SharedAstroSpot[]): SharedAstroSpot[] {
    // Don't apply filtering to certified locations
    if (this.activeView === 'certified') {
      return locations;
    }
    
    // Reset filter map when processing a new batch
    this.filterDistanceMap.clear();
    
    // First prioritize certified locations (they're never filtered)
    const certified: SharedAstroSpot[] = [];
    const calculated: SharedAstroSpot[] = [];
    
    // Split locations into certified and calculated
    locations.forEach(loc => {
      if (loc.isDarkSkyReserve || loc.certification) {
        certified.push(loc);
      } else {
        calculated.push(loc);
      }
    });
    
    // Sort calculated by SIQS score (highest first)
    calculated.sort((a, b) => (getSiqsScore(b.siqs) || 0) - (getSiqsScore(a.siqs) || 0));
    
    // Apply distance filter to calculated spots only
    const filteredCalculated: SharedAstroSpot[] = [];
    
    for (const location of calculated) {
      const key = `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
      
      // Check if this location is too close to any already-added location
      let isTooClose = false;
      
      for (const addedLoc of [...certified, ...filteredCalculated]) {
        const distance = this.calculateDistance(
          location.latitude, location.longitude,
          addedLoc.latitude, addedLoc.longitude
        );
        
        // Skip if too close to an existing location
        if (distance < this.minimumDistance) {
          isTooClose = true;
          break;
        }
      }
      
      if (!isTooClose) {
        filteredCalculated.push(location);
        this.filterDistanceMap.set(key, true);
      }
    }
    
    // Combine certified (all) with filtered calculated
    return [...certified, ...filteredCalculated];
  }
  
  /**
   * Helper to calculate distance between two points
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }
  
  /**
   * Convert degrees to radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
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
      const filteredLocations = this.filterByDistance(locations);
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
    const isCertified = location.isDarkSkyReserve === true || (typeof location.certification === 'string' && location.certification !== '');
    const siqs = location.siqs || 0;
    
    // Choose icon based on location type
    const icon = this.getMarkerIcon(isCertified, siqs, isSelected);
    
    // Create the marker
    const marker = L.marker([location.latitude, location.longitude], { icon });
    
    // Add tooltip
    marker.bindTooltip(`${location.name || 'Unknown Location'} (SIQS: ${formatSiqsScore(siqs)})`);
    
    return marker;
  }
  
  /**
   * Get appropriate icon based on location type
   */
  private getMarkerIcon(isCertified: boolean, siqs: number | { score: number; isViable: boolean }, isSelected: boolean): Icon {
    // Default icon properties
    let iconUrl = '/markers/marker-default.svg';
    let iconSize: [number, number] = [30, 30];
    
    // Get numeric siqs score
    const siqsScore = getSiqsScore(siqs);
    
    // Select icon based on location type and SIQS
    if (isCertified) {
      iconUrl = '/markers/marker-certified.svg';
      iconSize = [36, 36];
    } else if (siqsScore >= 8) {
      iconUrl = '/markers/marker-excellent.svg';
    } else if (siqsScore >= 6) {
      iconUrl = '/markers/marker-good.svg';
    } else if (siqsScore >= 4) {
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
