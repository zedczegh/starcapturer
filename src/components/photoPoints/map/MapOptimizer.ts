
/**
 * Utility class to optimize map performance and loading
 */
export class MapOptimizer {
  private static markerCache = new Map<string, any>();
  private static tileLayerCache = new Map<string, any>();
  
  /**
   * Clear marker cache to free memory
   */
  static clearMarkerCache() {
    this.markerCache.clear();
  }
  
  /**
   * Cache a marker by location ID
   */
  static cacheMarker(id: string, marker: any) {
    this.markerCache.set(id, marker);
  }
  
  /**
   * Get a cached marker by location ID
   */
  static getCachedMarker(id: string) {
    return this.markerCache.get(id);
  }
  
  /**
   * Check if a marker exists in cache
   */
  static hasMarker(id: string) {
    return this.markerCache.has(id);
  }
  
  /**
   * Cache a tile layer by URL
   */
  static cacheTileLayer(url: string, layer: any) {
    this.tileLayerCache.set(url, layer);
  }
  
  /**
   * Get a cached tile layer by URL
   */
  static getCachedTileLayer(url: string) {
    return this.tileLayerCache.get(url);
  }
  
  /**
   * Check if tile layer exists in cache
   */
  static hasTileLayer(url: string) {
    return this.tileLayerCache.has(url);
  }
  
  /**
   * Clear all caches
   */
  static clearAllCaches() {
    this.markerCache.clear();
    this.tileLayerCache.clear();
  }
  
  /**
   * Optimize markers for large datasets by clustering or limiting visible markers
   */
  static optimizeMarkers(markers: any[], map: any, zoom: number): any[] {
    // At low zoom levels, limit number of visible markers
    if (zoom < 5) {
      // For world view, only show a subset of markers
      return markers.filter((_, index) => index % Math.max(1, Math.floor(markers.length / 100)) === 0);
    } else if (zoom < 8) {
      // For regional view, show more markers but still limit
      return markers.filter((_, index) => index % Math.max(1, Math.floor(markers.length / 200)) === 0);
    }
    
    // At higher zoom levels, show all markers
    return markers;
  }
}
