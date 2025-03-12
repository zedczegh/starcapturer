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
    children?: React.ReactNode;
  }

  export interface TileLayerProps extends L.TileLayerOptions {
    url: string;
    attribution?: string;
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
  
  // Add useMapEvents hook type
  export function useMapEvents(handlers: {
    [key: string]: (e: L.LeafletEvent) => void;
  }): L.Map | null;
}

// Define WeatherData interface globally
interface WeatherData {
  cloudCover: number;
  windSpeed: number;
  humidity: number;
  temperature?: number;
}
