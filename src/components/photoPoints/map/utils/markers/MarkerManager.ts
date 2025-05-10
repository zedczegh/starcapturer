
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { createLocationMarkerIcon } from './MarkerManager';
import { isValidLocation, isWaterLocation } from '@/utils/location/validators';

/**
 * Manages marker instances and rendering for map components
 */
export class MarkerManager {
  private markers: Map<string, L.Marker> = new Map();
  private map: L.Map | null = null;
  private clusterer: L.MarkerClusterGroup | null = null;
  
  /**
   * Initialize the marker manager with a Leaflet map instance
   */
  public initialize(map: L.Map): void {
    this.map = map;
    
    // Create marker clusterer if needed
    if (this.shouldUseClusterer()) {
      this.initializeClusterer();
    }
  }
  
  /**
   * Determine if clustering should be used based on device capabilities
   */
  private shouldUseClusterer(): boolean {
    // Only use clusterer on desktop devices with good performance
    return !this.isLowEndDevice();
  }
  
  /**
   * Detect if the current device is low-end
   */
  private isLowEndDevice(): boolean {
    // Check for mobile first
    const userAgent = navigator.userAgent || navigator.vendor || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    if (isMobile) return true;
    
    // Then check for CPU cores as a performance indicator
    const cpuCores = navigator.hardwareConcurrency || 4;
    return cpuCores < 4;
  }
  
  /**
   * Initialize the marker clusterer
   */
  private initializeClusterer(): void {
    if (!this.map) return;
    
    try {
      // This would typically use MarkerClusterGroup from leaflet.markercluster
      // For this example, we'll create a simple object that mimics the interface
      this.clusterer = {
        clearLayers: () => {},
        addLayer: (marker: L.Marker) => { if (this.map) marker.addTo(this.map); },
        getBounds: () => L.latLngBounds([]),
        getVisibleParent: (marker: L.Marker) => marker
      } as unknown as L.MarkerClusterGroup;
      
      // Add clusterer to map
      if (this.map) {
        // In real implementation: this.map.addLayer(this.clusterer);
      }
    } catch (error) {
      console.error("Error initializing marker clusterer:", error);
      this.clusterer = null;
    }
  }
  
  /**
   * Render markers on the map
   */
  public renderMarkers(
    locations: SharedAstroSpot[],
    selectedId?: string,
    bounds?: L.LatLngBounds
  ): void {
    if (!this.map) return;
    
    // Track which markers we've already processed
    const processedIds = new Set<string>();
    
    // Process each location
    for (const location of locations) {
      if (!isValidLocation(location)) continue;
      
      // Skip water locations unless certified
      const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
      if (!isCertified && isWaterLocation(location.latitude, location.longitude, false)) {
        continue;
      }
      
      // Generate a unique ID for the marker
      const id = this.getLocationId(location);
      processedIds.add(id);
      
      // Check if marker is already on the map
      const existingMarker = this.markers.get(id);
      
      // Skip if the marker is already rendered and not selected
      if (existingMarker && id !== selectedId) continue;
      
      // Create marker options
      const isSelected = id === selectedId;
      const markerOptions = {
        isSelected,
        isCertified,
        isDestination: location.type === 'destination',
        isHovered: false
      };
      
      if (existingMarker) {
        // Update existing marker
        const icon = createLocationMarkerIcon(location, markerOptions);
        existingMarker.setIcon(icon);
      } else {
        // Create a new marker
        const icon = createLocationMarkerIcon(location, markerOptions);
        const marker = L.marker([location.latitude, location.longitude], { icon });
        
        // Store the marker
        this.markers.set(id, marker);
        
        // Add to map or clusterer
        if (this.clusterer) {
          this.clusterer.addLayer(marker);
        } else {
          marker.addTo(this.map);
        }
      }
    }
    
    // Remove markers that are no longer in the data
    this.markers.forEach((marker, id) => {
      if (!processedIds.has(id)) {
        if (this.clusterer) {
          this.clusterer.removeLayer(marker);
        } else if (this.map) {
          this.map.removeLayer(marker);
        }
        this.markers.delete(id);
      }
    });
  }
  
  /**
   * Generate a unique ID for a location
   */
  private getLocationId(location: SharedAstroSpot): string {
    if (location.id) return location.id;
    return `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
  }
  
  /**
   * Clear all markers from the map
   */
  public clearMarkers(): void {
    if (this.clusterer) {
      this.clusterer.clearLayers();
    } else if (this.map) {
      this.markers.forEach(marker => {
        this.map?.removeLayer(marker);
      });
    }
    
    this.markers.clear();
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    this.clearMarkers();
    
    if (this.clusterer && this.map) {
      this.map.removeLayer(this.clusterer);
    }
    
    this.clusterer = null;
    this.map = null;
  }
}

/**
 * Create a marker icon for a location
 */
function isValidLocation(location: SharedAstroSpot): boolean {
  return (
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    isFinite(location.latitude) &&
    isFinite(location.longitude)
  );
}

/**
 * Create a marker icon for a location
 */
export function createLocationMarkerIcon(
  location: SharedAstroSpot,
  options: {
    isHovered?: boolean;
    isSelected?: boolean;
    isCertified?: boolean;
    isDestination?: boolean;
  } = {}
): L.Icon {
  // This is a simplified implementation
  return L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41]
  });
}
