
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { validateLocationWithReverseGeocoding } from '@/utils/location/reverseGeocodingValidator';
import { MarkerManager } from './markers/MarkerManager';
import { LocationFilter } from './filters/LocationFilter';

/**
 * Manager for optimizing map marker rendering
 * Uses clustering, render throttling, and visibility checks
 */
export class MapOptimizer {
  private markerManager: MarkerManager;
  private locationFilter: LocationFilter;
  private map: L.Map | null = null;
  private renderTimeout: NodeJS.Timeout | null = null;
  private activeView: 'certified' | 'calculated' = 'certified';
  
  constructor() {
    this.markerManager = new MarkerManager();
    this.locationFilter = new LocationFilter();
  }
  
  /**
   * Initialize with the Leaflet map instance
   */
  public initialize(map: L.Map): void {
    this.map = map;
    this.markerManager.initialize(map);
    
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
      this.locationFilter.resetDistanceFilters();
    }
  }
  
  /**
   * Update markers with new location data
   */
  public async updateMarkers(locations: SharedAstroSpot[], selectedId?: string): Promise<void> {
    if (!this.map) return;
    
    // Throttle rendering to prevent performance issues
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
    }
    
    this.renderTimeout = setTimeout(async () => {
      // Filter locations through reverse geocoding for calculated spots
      const validatedLocations = await this.validateLocations(locations);
      
      // Apply distance filtering to validated locations
      const filteredLocations = this.locationFilter.filterByDistance(
        validatedLocations, 
        this.activeView
      );
      
      this.markerManager.renderMarkers(
        filteredLocations, 
        selectedId, 
        this.map!.getBounds()
      );
    }, 50);
  }

  /**
   * Validate locations using reverse geocoding
   */
  private async validateLocations(locations: SharedAstroSpot[]): Promise<SharedAstroSpot[]> {
    const validatedLocations: SharedAstroSpot[] = [];
    
    for (const location of locations) {
      // Skip validation for certified locations
      if (location.isDarkSkyReserve || location.certification) {
        validatedLocations.push(location);
        continue;
      }
      
      // Validate calculated spots
      const isValid = await validateLocationWithReverseGeocoding(location);
      if (isValid) {
        validatedLocations.push(location);
      } else {
        console.log(`Filtered out invalid location at [${location.latitude}, ${location.longitude}]`);
      }
    }
    
    return validatedLocations;
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
    this.markerManager.clearMarkers();
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
    this.markerManager.destroy();
  }
}

// Export singleton instance
export const mapOptimizer = new MapOptimizer();
