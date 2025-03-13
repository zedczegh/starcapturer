
import L from "leaflet";

// This service handles offline map functionality
export class OfflineMapService {
  private static instance: OfflineMapService;
  private offlineTileLayer: L.TileLayer | null = null;
  private onlineTileLayer: L.TileLayer | null = null;
  private isOfflineMode: boolean = false;
  private offlineTiles: Map<string, string> = new Map(); // URL -> local data URL
  private downloadQueue: Set<string> = new Set();
  private isDownloading: boolean = false;
  private offlineRegions: { bounds: L.LatLngBounds; minZoom: number; maxZoom: number }[] = [];

  private constructor() {
    // Private constructor for singleton pattern
    this.loadCachedTiles();
  }

  public static getInstance(): OfflineMapService {
    if (!OfflineMapService.instance) {
      OfflineMapService.instance = new OfflineMapService();
    }
    return OfflineMapService.instance;
  }

  // Load cached tiles from localStorage
  private loadCachedTiles(): void {
    try {
      const storedTiles = localStorage.getItem('offlineTiles');
      if (storedTiles) {
        this.offlineTiles = new Map(JSON.parse(storedTiles));
      }
      
      const storedRegions = localStorage.getItem('offlineRegions');
      if (storedRegions) {
        const regions = JSON.parse(storedRegions);
        this.offlineRegions = regions.map((r: any) => ({
          bounds: L.latLngBounds(
            L.latLng(r.bounds._southWest.lat, r.bounds._southWest.lng),
            L.latLng(r.bounds._northEast.lat, r.bounds._northEast.lng)
          ),
          minZoom: r.minZoom,
          maxZoom: r.maxZoom
        }));
      }
    } catch (error) {
      console.error('Error loading cached tiles:', error);
      // Reset if there's an error
      this.offlineTiles = new Map();
      this.offlineRegions = [];
    }
  }

  // Save current cache to localStorage
  private saveCachedTiles(): void {
    try {
      localStorage.setItem('offlineTiles', JSON.stringify(Array.from(this.offlineTiles.entries())));
      
      // Save regions in a serializable format
      const serializedRegions = this.offlineRegions.map(r => ({
        bounds: {
          _southWest: { lat: r.bounds.getSouthWest().lat, lng: r.bounds.getSouthWest().lng },
          _northEast: { lat: r.bounds.getNorthEast().lat, lng: r.bounds.getNorthEast().lng }
        },
        minZoom: r.minZoom,
        maxZoom: r.maxZoom
      }));
      localStorage.setItem('offlineRegions', JSON.stringify(serializedRegions));
    } catch (error) {
      console.error('Error saving cached tiles:', error);
    }
  }

  // Create a custom tile layer that uses offline tiles when available
  public createTileLayer(url: string, options: L.TileLayerOptions): L.TileLayer {
    const offlineService = this;
    
    // Create a custom tile layer that will check for offline tiles first
    const customLayer = L.tileLayer(url, {
      ...options,
      // Override getTileUrl to use cached tiles when in offline mode
      getTileUrl: function(coords) {
        const originalUrl = (L.TileLayer.prototype.getTileUrl.call(this, coords) as string);
        
        if (offlineService.isInOfflineMode() && offlineService.hasTile(originalUrl)) {
          return offlineService.getTile(originalUrl) || originalUrl;
        }
        
        // Queue this tile for download if we're in a saved region
        if (!offlineService.isInOfflineMode() && offlineService.isInOfflineRegion(coords, this._zoom)) {
          offlineService.queueTileForDownload(originalUrl);
        }
        
        return originalUrl;
      }
    });
    
    this.onlineTileLayer = customLayer;
    return customLayer;
  }

  // Check if a point is within any saved offline region
  private isInOfflineRegion(coords: L.Coords, zoom: number): boolean {
    const tilePoint = this.coordsToLatLng(coords, zoom);
    
    return this.offlineRegions.some(region => 
      region.bounds.contains(tilePoint) && 
      zoom >= region.minZoom && 
      zoom <= region.maxZoom
    );
  }

  // Convert tile coordinates to lat/lng
  private coordsToLatLng(coords: L.Coords, zoom: number): L.LatLng {
    const scale = Math.pow(2, zoom);
    const tileSize = 256;
    
    const lon = coords.x / scale * 360 - 180;
    const n = Math.PI - 2 * Math.PI * coords.y / scale;
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    
    return L.latLng(lat, lon);
  }

  // Queue a tile for download
  private queueTileForDownload(url: string): void {
    if (!this.hasTile(url) && !this.downloadQueue.has(url)) {
      this.downloadQueue.add(url);
      this.startDownloadQueue();
    }
  }

  // Start processing the download queue
  private startDownloadQueue(): void {
    if (this.isDownloading || this.downloadQueue.size === 0) return;
    
    this.isDownloading = true;
    this.processDownloadQueue();
  }

  // Process tiles in the download queue
  private async processDownloadQueue(): Promise<void> {
    if (this.downloadQueue.size === 0) {
      this.isDownloading = false;
      return;
    }
    
    // Take the next tile from the queue
    const url = this.downloadQueue.values().next().value;
    this.downloadQueue.delete(url);
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const dataUrl = await this.blobToDataURL(blob);
      
      this.offlineTiles.set(url, dataUrl);
      this.saveCachedTiles();
      
      // Continue with the next tile
      setTimeout(() => this.processDownloadQueue(), 100);
    } catch (error) {
      console.error('Error downloading tile:', error);
      // Continue with the next tile even if this one failed
      setTimeout(() => this.processDownloadQueue(), 100);
    }
  }

  // Convert blob to data URL
  private blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Get an offline tile by URL
  public getTile(url: string): string | null {
    return this.offlineTiles.get(url) || null;
  }

  // Check if we have a tile cached
  public hasTile(url: string): boolean {
    return this.offlineTiles.has(url);
  }

  // Toggle offline mode
  public toggleOfflineMode(): boolean {
    this.isOfflineMode = !this.isOfflineMode;
    return this.isOfflineMode;
  }

  // Check if we're in offline mode
  public isInOfflineMode(): boolean {
    return this.isOfflineMode;
  }

  // Save a region for offline use
  public saveRegionForOffline(bounds: L.LatLngBounds, minZoom: number, maxZoom: number): void {
    this.offlineRegions.push({ bounds, minZoom, maxZoom });
    this.saveCachedTiles();
    
    // Start downloading tiles for this region
    if (this.onlineTileLayer) {
      const map = this.onlineTileLayer._map;
      if (map) {
        for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
          this.queueTilesInBounds(bounds, zoom);
        }
      }
    }
  }

  // Queue all tiles in a bounding box for a specific zoom level
  private queueTilesInBounds(bounds: L.LatLngBounds, zoom: number): void {
    if (!this.onlineTileLayer || !this.onlineTileLayer._map) return;
    
    const map = this.onlineTileLayer._map;
    const tileSize = 256;
    
    // Get tile coordinates for southwest and northeast corners
    const sw = map._latLngToNewLayerPoint(bounds.getSouthWest(), zoom, map.getCenter());
    const ne = map._latLngToNewLayerPoint(bounds.getNorthEast(), zoom, map.getCenter());
    
    // Convert pixel coordinates to tile coordinates
    const minX = Math.floor(sw.x / tileSize);
    const maxX = Math.floor(ne.x / tileSize);
    const minY = Math.floor(ne.y / tileSize);
    const maxY = Math.floor(sw.y / tileSize);
    
    // Queue each tile in the region
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const coords = new L.Point(x, y) as unknown as L.Coords;
        coords.z = zoom;
        
        const url = this.onlineTileLayer.getTileUrl(coords);
        this.queueTileForDownload(url);
      }
    }
  }

  // Remove all cached tiles and regions
  public clearOfflineCache(): void {
    this.offlineTiles.clear();
    this.offlineRegions = [];
    this.saveCachedTiles();
  }

  // Get the size of the offline cache in MB
  public getCacheSize(): number {
    let totalSize = 0;
    
    for (const dataUrl of this.offlineTiles.values()) {
      totalSize += dataUrl.length * 0.75; // Rough estimation for base64 data
    }
    
    return totalSize / (1024 * 1024); // Convert to MB
  }

  // Get the list of saved regions
  public getSavedRegions(): { bounds: L.LatLngBounds; minZoom: number; maxZoom: number }[] {
    return [...this.offlineRegions];
  }
}

export default OfflineMapService.getInstance();
