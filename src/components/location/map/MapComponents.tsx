
import React, { useEffect, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Create custom markers without relying on external image files
export const createCustomMarker = (color?: string) => {
  // Use base64 encoded SVG to create marker
  const defaultColor = color || '#3b82f6'; // Default to blue if no color provided
  
  // Generate SVG string for a pin marker
  const svgString = `
  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 100 100">
    <path fill="${defaultColor}" d="M50 0 C22.4 0 0 22.4 0 50c0 43.8 50 50 50 50 0 0 50-6.2 50-50C100 22.4 77.6 0 50 0zM50 7.8c23.2 0 42.2 19 42.2 42.2S73.2 92.2 50 92.2 7.8 73.2 7.8 50 26.8 7.8 50 7.8z"/>
    <circle cx="50" cy="50" r="25" fill="${defaultColor}" />
  </svg>`;
  
  // Encode SVG string as base64
  const svgBase64 = btoa(svgString);
  
  // Create icon with shadow
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${svgBase64}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });
};

// Map Updater Component - Updates map center when position changes
export const MapUpdater = ({ position }: { position: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    // Check if position is valid
    if (position && position[0] && position[1]) {
      map.setView(position, map.getZoom());
    }
  }, [map, position]);
  
  return null;
};

// Map Events Component - Handles map click events
export const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  
  return null;
};

// Map Styles Component - Inserts required CSS for the map
export const MapStyles = () => {
  return (
    <style jsx="true">{`
      .leaflet-container {
        background-color: #0f1729;
        border-radius: 0.5rem;
      }
      .leaflet-control-zoom {
        border: none !important;
      }
      .leaflet-control-zoom a {
        background-color: #1e293b !important;
        color: white !important;
        border: 1px solid #334155 !important;
      }
      .leaflet-control-zoom a:hover {
        background-color: #334155 !important;
      }
      .leaflet-popup-content-wrapper,
      .leaflet-popup-tip {
        background-color: #1e293b !important;
        color: white !important;
        border: 1px solid #334155 !important;
      }
    `}</style>
  );
};

// Dark Sky Overlay Component - Shows special overlay for dark sky locations
export const DarkSkyOverlay = ({ 
  isDarkSkyReserve, 
  position 
}: { 
  isDarkSkyReserve: boolean; 
  position: [number, number];
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (isDarkSkyReserve) {
      // Optional: Add additional dark sky visualization here
      // For now we're using the Circle component in the parent component
    }
  }, [isDarkSkyReserve, map, position]);
  
  return null;
};
