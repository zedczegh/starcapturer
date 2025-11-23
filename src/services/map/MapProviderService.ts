/**
 * Map Provider Service
 * Provides abstraction layer for different map providers (Leaflet, AMap)
 * This ensures all map functionality works identically regardless of provider
 */

import type { MapProvider, MapOptions, UnifiedMapInstance } from '@/types/map';

export class MapProviderService {
  private provider: MapProvider;
  private mapInstance: any;

  constructor(provider: MapProvider) {
    this.provider = provider;
  }

  /**
   * Initialize map with unified options
   */
  async initializeMap(
    container: HTMLElement, 
    options: MapOptions
  ): Promise<UnifiedMapInstance> {
    if (this.provider === 'amap') {
      return this.initializeAMap(container, options);
    } else {
      return this.initializeLeaflet(container, options);
    }
  }

  /**
   * Initialize Leaflet map (current implementation)
   */
  private async initializeLeaflet(
    container: HTMLElement,
    options: MapOptions
  ): Promise<UnifiedMapInstance> {
    const L = await import('leaflet');
    
    const map = L.map(container, {
      center: L.latLng(options.center[0], options.center[1]),
      zoom: options.zoom,
      scrollWheelZoom: options.scrollWheelZoom ?? true,
      attributionControl: options.attributionControl ?? false,
      worldCopyJump: options.worldCopyJump ?? false
    });

    // Add tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    this.mapInstance = map;

    // Return unified interface
    return {
      setCenter: (center, zoom) => {
        map.setView(L.latLng(center[0], center[1]), zoom ?? map.getZoom());
      },
      getCenter: () => {
        const center = map.getCenter();
        return [center.lat, center.lng];
      },
      getZoom: () => map.getZoom(),
      setZoom: (zoom) => map.setZoom(zoom),
      fitBounds: (bounds) => {
        map.fitBounds([
          [bounds.south, bounds.west],
          [bounds.north, bounds.east]
        ]);
      },
      on: (event, handler) => map.on(event, handler),
      off: (event, handler) => map.off(event, handler)
    };
  }

  /**
   * Initialize AMap (prepared for future implementation)
   */
  private async initializeAMap(
    container: HTMLElement,
    options: MapOptions
  ): Promise<UnifiedMapInstance> {
    const AMapLoader = await import('@amap/amap-jsapi-loader');
    
    const AMap = await AMapLoader.default.load({
      key: '', // Will be set via admin config
      version: '2.0',
      plugins: ['AMap.Marker', 'AMap.InfoWindow']
    });

    const map = new AMap.Map(container, {
      center: [options.center[1], options.center[0]], // AMap uses [lng, lat]
      zoom: options.zoom,
      scrollWheel: options.scrollWheelZoom ?? true
    });

    this.mapInstance = map;

    // Return unified interface
    return {
      setCenter: (center, zoom) => {
        map.setCenter([center[1], center[0]]);
        if (zoom !== undefined) map.setZoom(zoom);
      },
      getCenter: () => {
        const center = map.getCenter();
        return [center.getLat(), center.getLng()];
      },
      getZoom: () => map.getZoom(),
      setZoom: (zoom) => map.setZoom(zoom),
      fitBounds: (bounds) => {
        map.setBounds(new AMap.Bounds(
          [bounds.west, bounds.south],
          [bounds.east, bounds.north]
        ));
      },
      on: (event, handler) => map.on(event, handler),
      off: (event, handler) => map.off(event, handler)
    };
  }

  /**
   * Get the raw map instance for provider-specific operations
   */
  getRawInstance(): any {
    return this.mapInstance;
  }

  /**
   * Clean up map resources
   */
  destroy(): void {
    if (this.mapInstance) {
      if (this.provider === 'leaflet') {
        this.mapInstance.remove();
      } else if (this.provider === 'amap') {
        this.mapInstance.destroy();
      }
      this.mapInstance = null;
    }
  }
}
