
/**
 * MarkerManager class for handling map marker operations
 */
class MarkerManager {
  private markers: Map<string, any>;
  
  constructor() {
    this.markers = new Map();
  }
  
  /**
   * Add a marker to the manager
   * @param id Unique marker ID
   * @param marker The marker object
   */
  addMarker(id: string, marker: any): void {
    this.markers.set(id, marker);
  }
  
  /**
   * Get a marker by ID
   * @param id Marker ID
   * @returns The marker object or undefined
   */
  getMarker(id: string): any {
    return this.markers.get(id);
  }
  
  /**
   * Remove a marker from the manager
   * @param id Marker ID
   */
  removeMarker(id: string): void {
    this.markers.delete(id);
  }
  
  /**
   * Check if a marker exists
   * @param id Marker ID
   * @returns True if marker exists
   */
  hasMarker(id: string): boolean {
    return this.markers.has(id);
  }
  
  /**
   * Get all markers
   * @returns Array of all markers
   */
  getAllMarkers(): any[] {
    return Array.from(this.markers.values());
  }
  
  /**
   * Clear all markers
   */
  clearMarkers(): void {
    this.markers.clear();
  }
}

export default MarkerManager;
