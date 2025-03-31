
import React from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// Update map view when center position changes
export function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  
  React.useEffect(() => {
    map.setView(position, map.getZoom(), {
      animate: true,
      duration: 1
    });
  }, [map, position]);
  
  return null;
}

// Handle map click events for editable maps
export function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  React.useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
}

// Apply global map styles
export function MapStyles() {
  return (
    <style>{`
      .leaflet-container {
        height: 100%;
        width: 100%;
        border-radius: 0.5rem;
        z-index: 1;
      }
      
      .leaflet-control-attribution {
        font-size: 10px;
        background-color: rgba(0, 0, 0, 0.5) !important;
        color: rgba(255, 255, 255, 0.7) !important;
      }
      
      .leaflet-control-attribution a {
        color: rgba(255, 255, 255, 0.9) !important;
      }
      
      .leaflet-popup-content-wrapper, .leaflet-popup-tip {
        background-color: rgba(15, 23, 42, 0.9);
        color: #fff;
        border-radius: 0.5rem;
      }
      
      .leaflet-control-zoom a {
        background-color: rgba(15, 23, 42, 0.7) !important;
        color: #fff !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
      }
      
      .leaflet-control-zoom a:hover {
        background-color: rgba(30, 41, 59, 0.9) !important;
      }
    `}</style>
  );
}

// Create a custom marker icon
export function createCustomMarker(color = '#f43f5e') {
  const markerHtmlStyles = `
    background-color: ${color};
    width: 2rem;
    height: 2rem;
    display: block;
    position: relative;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 1px solid #FFFFFF;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  `;

  const pulseStyles = `
    content: '';
    width: 2rem;
    height: 2rem;
    border-radius: 50% 50% 50% 0;
    background-color: ${color};
    position: absolute;
    margin: -1px 0 0 -1px;
    animation: pulse 2s infinite;
    opacity: 0.5;
    box-shadow: 0 0 5px ${color};
    
    @keyframes pulse {
      0% {
        transform: scale(0.5);
        opacity: 0;
      }
      50% {
        opacity: 0.5;
      }
      100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }
  `;

  const icon = L.divIcon({
    className: "custom-marker-icon",
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
    html: `<span style="${markerHtmlStyles}">
             <span style="${pulseStyles}"></span>
           </span>`,
    iconSize: [24, 24]
  });

  return icon;
}
