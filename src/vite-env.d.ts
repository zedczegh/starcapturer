
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

// Define API related interfaces
declare module '@/lib/api' {
  // Weather and location APIs
  export function fetchWeatherData(coordinates: { latitude: number; longitude: number; days?: number }): Promise<WeatherData | null>;
  export function fetchForecastData(coordinates: { latitude: number; longitude: number; days?: number }): Promise<any | null>;
  export function fetchLightPollutionData(latitude: number, longitude: number): Promise<{ bortleScale: number } | null>;
  export function getLocationNameFromCoordinates(latitude: number, longitude: number, language?: string): Promise<string>;
  export function determineWeatherCondition(cloudCover: number): string;
  export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
  
  // Shared spots and recommendations
  export interface SharedAstroSpot {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    description: string;
    bortleScale: number;
    date: string;
    userId?: string;
    username?: string;
    likes?: number;
    distance?: number;
    siqs?: number;
    photoUrl?: string;
    photographer?: string;
    targets?: string[];
    isViable?: boolean;
    timestamp?: string;
  }
  
  export function shareAstroSpot(spotData: Omit<SharedAstroSpot, 'id' | 'date'>): Promise<{ success: boolean; id?: string; message?: string }>;
  export function getSharedAstroSpots(latitude: number, longitude: number, limit?: number, radius?: number): Promise<SharedAstroSpot[]>;
  export function getRecommendedPhotoPoints(latitude: number, longitude: number, limit?: number): Promise<SharedAstroSpot[]>;
  export function generateBaiduMapsUrl(latitude: number, longitude: number, name: string): string;
  
  // Location database function
  export function findNearestLocationsInDatabase(
    latitude: number, 
    longitude: number, 
    maxDistance?: number
  ): Array<{
    name: string;
    country?: string;
    region?: string;
    latitude: number;
    longitude: number;
    bortleScale: number;
    distance: number;
  }>;
}
