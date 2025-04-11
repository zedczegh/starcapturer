/// <reference types="vite/client" />
/// <reference types="react-leaflet" />
/// <reference types="leaflet" />

declare module "react-leaflet" {
  import { FC, ReactNode } from "react";
  import * as L from "leaflet";
  
  // Core components
  export const MapContainer: FC<{
    center: [number, number];
    zoom: number;
    children?: ReactNode;
    style?: React.CSSProperties;
    className?: string;
    scrollWheelZoom?: boolean;
    whenReady?: (map: any) => void;
    attributionControl?: boolean;
    onClick?: (e: any) => void;
    [key: string]: any;
  }>;
  
  export const TileLayer: FC<{
    attribution?: string;
    url: string;
    subdomains?: string;
    [key: string]: any;
  }>;
  
  export const Circle: FC<{
    center: [number, number];
    radius: number;
    pathOptions?: {
      color?: string;
      fillColor?: string;
      fillOpacity?: number;
      weight?: number;
      opacity?: number;
      dashArray?: string;
      className?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }>;
  
  // Marker and Popup
  export interface MarkerProps extends L.MarkerOptions {
    position: [number, number];
    icon?: L.Icon;
    eventHandlers?: {
      click?: () => void;
      mouseover?: () => void;
      mouseout?: () => void;
      [key: string]: any;
    };
    children?: ReactNode;
    [key: string]: any;
  }
  
  export const Marker: FC<MarkerProps>;
  
  export interface PopupProps {
    children?: ReactNode;
    className?: string;
    closeOnClick?: boolean;
    autoClose?: boolean;
    closeButton?: boolean;
    autoPan?: boolean;
    maxWidth?: number;
    [key: string]: any;
  }
  
  export const Popup: FC<PopupProps>;
  
  // Hooks
  export function useMap(): L.Map;
  export function useMapEvents(events: Record<string, (e: any) => void>): L.Map;
  
  // Other components
  export const LayerGroup: FC<{ children?: ReactNode; [key: string]: any }>;
  export const FeatureGroup: FC<{ children?: ReactNode; [key: string]: any }>;
  export const Tooltip: FC<{ children?: ReactNode; [key: string]: any }>;
  export const ZoomControl: FC<{ position?: string; [key: string]: any }>;
  export const ScaleControl: FC<{ position?: string; [key: string]: any }>;
  export const AttributionControl: FC<{ position?: string; [key: string]: any }>;
  
  // GeoJSON
  export const GeoJSON: FC<{
    data: any;
    style?: any;
    pointToLayer?: (feature: any, latlng: L.LatLng) => L.Layer;
    onEachFeature?: (feature: any, layer: L.Layer) => void;
    filter?: (feature: any) => boolean;
    [key: string]: any;
  }>;
  
  // Other common components
  export const Polyline: FC<{
    positions: [number, number][] | [number, number][][];
    [key: string]: any;
  }>;
  export const Polygon: FC<{
    positions: [number, number][] | [number, number][][];
    [key: string]: any;
  }>;
  export const Rectangle: FC<{
    bounds: L.LatLngBoundsExpression;
    [key: string]: any;
  }>;
}

// Extend window to include global variables
declare interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: any;
  __INITIAL_STATE__?: any;
  leafletMap?: any;
}
