import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { validateLocationWithReverseGeocoding } from '@/utils/location/reverseGeocodingValidator';
import { MarkerManager } from './markers/MarkerManager';

// Define LocationFilter class inline since it was missing
class LocationFilter {
  // Track filter settings
  private maxDistance: number = 500; // km
  
  /**
   * Reset distance filters
   */
  public resetDistanceFilters(): void {
    this.maxDistance = 500;
  }
  
  /**
   * Filter locations by distance from user
   */
  public filterByDistance(
    locations: SharedAstroSpot[],
    activeView: 'certified' | 'calculated'
  ): SharedAstroSpot[] {
    // Don't filter certified locations by distance in any view
    if (activeView === 'certified') {
      return locations.filter(loc => 
        loc.isDarkSkyReserve || loc.certification
      );
    }
    
    // For calculated view, apply distance filtering only to non-certified locations
    const certifiedLocations = locations.filter(loc => 
      loc.isDarkSkyReserve || loc.certification
    );
    
    const filteredNonCertified = locations
      .filter(loc => !loc.isDarkSkyReserve && !loc.certification)
      .filter(loc => {
        // If no distance info, keep the location
        if (typeof loc.distance !== 'number') return true;
        
        // Filter by distance
        return loc.distance <= this.maxDistance;
      });
    
    // Return combined results
    return [...certifiedLocations, ...filteredNonCertified];
  }
}

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
  private validatedLocations: Map<string, boolean> = new Map(); // Cache validation results
  private previousLocations: Map<string, SharedAstroSpot> = new Map(); // Store previous locations
  
  constructor() {
    this.markerManager = new MarkerManager();
    this.locationFilter = new LocationFilter();
    
    // Try to load previously validated locations from storage
    try {
      const storedValidations = sessionStorage.getItem('validated_locations');
      if (storedValidations) {
        this.validatedLocations = new Map(JSON.parse(storedValidations));
        console.log(`Loaded ${this.validatedLocations.size} cached location validations`);
      }
    } catch (err) {
      console.error('Error loading validated locations from storage:', err);
    }
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
    
    // Load persisted locations based on view type
    this.loadPersistedLocations();
  }
  
  /**
   * Set the active view type
   */
  public setActiveView(view: 'certified' | 'calculated'): void {
    if (this.activeView !== view) {
      this.activeView = view;
      this.clearMarkers();
      this.locationFilter.resetDistanceFilters();
      
      // Load the appropriate persisted locations for this view
      this.loadPersistedLocations();
    }
  }
  
  /**
   * Load persisted locations from session storage
   */
  private loadPersistedLocations(): void {
    if (!this.map) return;
    
    try {
      const storageKey = this.activeView === 'certified' ? 
        'persistent_certified_locations' : 
        'persistent_calculated_locations';
      
      const storedData = sessionStorage.getItem(storageKey);
      
      if (storedData) {
        const persistedLocations = JSON.parse(storedData) as SharedAstroSpot[];
        
        if (persistedLocations.length > 0) {
          console.log(`Loading ${persistedLocations.length} persisted ${this.activeView} locations`);
          
          // Clear existing markers before adding persisted ones
          this.markerManager.clearMarkers();
          
          // Add persisted locations to the map
          this.markerManager.renderMarkers(
            persistedLocations, 
            undefined, 
            this.map.getBounds()
          );
          
          // Store in previous locations
          persistedLocations.forEach(loc => {
            if (loc.latitude && loc.longitude) {
              const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
              this.previousLocations.set(key, loc);
            }
          });
        }
      }
    } catch (err) {
      console.error('Error loading persisted locations:', err);
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
      // Combine new locations with previous ones to ensure persistence
      const combinedLocations = this.combineWithPreviousLocations(locations);
      
      // Filter locations through reverse geocoding for calculated spots
      const validatedLocations = await this.validateLocations(combinedLocations);
      
      // Apply distance filtering to validated locations
      const filteredLocations = this.locationFilter.filterByDistance(
        validatedLocations, 
        this.activeView
      );
      
      // Save validations to session storage periodically
      this.saveValidationsToStorage();
      
      // Update the markers
      this.markerManager.renderMarkers(
        filteredLocations, 
        selectedId, 
        this.map!.getBounds()
      );
      
      // Update previous locations with the new set
      filteredLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          this.previousLocations.set(key, loc);
        }
      });
    }, 50);
  }
  
  /**
   * Combine new locations with previous ones to maintain persistence
   */
  private combineWithPreviousLocations(newLocations: SharedAstroSpot[]): SharedAstroSpot[] {
    // Create a map of new locations by their coordinate key
    const newLocationsMap = new Map<string, SharedAstroSpot>();
    
    // Add all new locations to the map
    newLocations.forEach(loc => {
      if (loc.latitude && loc.longitude) {
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        newLocationsMap.set(key, loc);
      }
    });
    
    // Add any previous locations not in the new set
    this.previousLocations.forEach((prevLoc, key) => {
      if (!newLocationsMap.has(key)) {
        // Only include locations appropriate for the current view
        if (this.activeView === 'certified') {
          if (prevLoc.isDarkSkyReserve || prevLoc.certification) {
            newLocationsMap.set(key, prevLoc);
          }
        } else {
          // For calculated view, include all types
          newLocationsMap.set(key, prevLoc);
        }
      }
    });
    
    // Return as array
    return Array.from(newLocationsMap.values());
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
      
      // Create a key for this location
      const locKey = `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
      
      // Check if we've already validated this location
      if (this.validatedLocations.has(locKey)) {
        const isValid = this.validatedLocations.get(locKey);
        if (isValid) {
          validatedLocations.push(location);
        }
        continue;
      }
      
      // Validate calculated spots
      const isValid = await validateLocationWithReverseGeocoding(location);
      
      // Store the validation result
      this.validatedLocations.set(locKey, isValid);
      
      if (isValid) {
        validatedLocations.push(location);
      } else {
        console.log(`Filtered out invalid location at [${location.latitude}, ${location.longitude}]`);
      }
    }
    
    return validatedLocations;
  }
  
  /**
   * Save validation results to session storage
   */
  private saveValidationsToStorage(): void {
    try {
      if (this.validatedLocations.size > 0) {
        // Convert Map to array for storage
        const validationsArray = Array.from(this.validatedLocations.entries());
        sessionStorage.setItem('validated_locations', JSON.stringify(validationsArray));
      }
    } catch (err) {
      console.error('Error saving validations to storage:', err);
    }
  }
  
  /**
   * Refresh visible markers based on map bounds
   */
  private refreshVisibleMarkers(): void {
    if (!this.map) return;
    
    // When map view changes, update markers with the combined locations
    if (this.previousLocations.size > 0) {
      const locationsArray = Array.from(this.previousLocations.values());
      this.markerManager.renderMarkers(
        locationsArray,
        undefined,
        this.map.getBounds()
      );
    }
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
    
    // Save validations before destroying
    this.saveValidationsToStorage();
  }
}

// Export singleton instance
export const mapOptimizer = new MapOptimizer();
