
/// <reference types="vite/client" />

// Add type declarations for react-leaflet
declare module 'react-leaflet' {
  import * as L from 'leaflet';
  import * as React from 'react';

  export interface MapContainerProps extends L.MapOptions {
    center: L.LatLngExpression;
    zoom?: number;
    scrollWheelZoom?: boolean;
    style?: React.CSSProperties;
    whenCreated?: (map: L.Map) => void;
    whenReady?: (event: { target: L.Map }) => void;
    attributionControl?: boolean;
    children?: React.ReactNode;
  }

  export interface TileLayerProps extends L.TileLayerOptions {
    url: string;
    attribution?: string;
    subdomains?: string | string[];
    opacity?: number;
    zIndex?: number;
    children?: React.ReactNode;
  }

  export interface MarkerProps extends L.MarkerOptions {
    position: L.LatLngExpression;
    icon?: L.Icon | L.DivIcon;
    children?: React.ReactNode;
  }

  export interface PopupProps extends L.PopupOptions {
    children?: React.ReactNode;
  }

  export class MapContainer extends React.Component<MapContainerProps> {}
  export class TileLayer extends React.Component<TileLayerProps> {}
  export class Marker extends React.Component<MarkerProps> {}
  export class Popup extends React.Component<PopupProps> {}
  
  // Fix: Update the map events hooks
  export function useMap(): L.Map;
  export function useMapEvents(handlers: {
    [key: string]: (e: L.LeafletEvent) => void;
  }): L.Map;
}

// Make Leaflet available globally
declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

// Define WeatherData interface globally
interface WeatherData {
  cloudCover: number;
  windSpeed: number;
  humidity: number;
  temperature?: number;
  precipitation?: number;
  weatherCondition?: string;
  aqi?: number;
}
