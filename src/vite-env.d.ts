
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
    whenReady?: (map: { target: L.Map }) => void;
    attributionControl?: boolean;
    className?: string;
    children?: React.ReactNode;
    minZoom?: number;
    worldCopyJump?: boolean;
    // Note: doubleClickZoom is not included here as we now handle it in MapController
  }

  export interface TileLayerProps extends L.TileLayerOptions {
    url: string;
    attribution?: string;
    subdomains?: string | string[];
    opacity?: number;
    zIndex?: number;
    children?: React.ReactNode;
    maxZoom?: number;
  }

  export interface MarkerProps extends L.MarkerOptions {
    position: L.LatLngExpression;
    icon?: L.Icon | L.DivIcon;
    onClick?: () => void; // Add onClick to the interface
    children?: React.ReactNode;
  }

  export interface PopupProps extends L.PopupOptions {
    autoClose?: boolean;
    closeOnClick?: boolean;
    offset?: L.PointExpression;
    direction?: string;
    onOpen?: () => void;
    onClose?: () => void;
    children?: React.ReactNode;
  }
  
  export interface CircleProps {
    center: L.LatLngExpression;
    radius: number;
    pathOptions?: L.PathOptions;
    children?: React.ReactNode;
  }

  export class MapContainer extends React.Component<MapContainerProps> {}
  export class TileLayer extends React.Component<TileLayerProps> {}
  export class Marker extends React.Component<MarkerProps> {}
  export class Popup extends React.Component<PopupProps> {}
  export class Circle extends React.Component<CircleProps> {}
  
  export function useMap(): L.Map;
}

// Make Leaflet available globally
declare global {
  interface Window {
    L: typeof import('leaflet');
    map?: L.Map; // Add map to window interface for direct access
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
