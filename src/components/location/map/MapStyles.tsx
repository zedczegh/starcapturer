
import React from "react";

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
        display: none !important;
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
