/**
 * Unified map abstraction types
 * Supports both Leaflet and AMap
 */

export type MapProvider = 'leaflet' | 'amap';

export interface MapPosition {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MarkerOptions {
  position: [number, number];
  icon?: any;
  draggable?: boolean;
  onClick?: () => void;
  onDragEnd?: (position: [number, number]) => void;
}

export interface PopupOptions {
  content: React.ReactNode;
  maxWidth?: number;
  offset?: [number, number];
  onClose?: () => void;
  onOpen?: () => void;
}

export interface MapOptions {
  center: [number, number];
  zoom: number;
  scrollWheelZoom?: boolean;
  attributionControl?: boolean;
  worldCopyJump?: boolean;
  onClick?: (lat: number, lng: number) => void;
}

export interface UnifiedMapInstance {
  setCenter: (center: [number, number], zoom?: number) => void;
  getCenter: () => [number, number];
  getZoom: () => number;
  setZoom: (zoom: number) => void;
  fitBounds: (bounds: MapBounds) => void;
  on: (event: string, handler: any) => void;
  off: (event: string, handler: any) => void;
}
