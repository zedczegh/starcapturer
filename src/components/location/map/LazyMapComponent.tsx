import React, { useEffect, useState, lazy, Suspense } from "react";
import { Marker, MapContainer, TileLayer, useMap } from "react-leaflet";
import { selectMapType } from "@/utils/mapUtils";
import { createMarkerIcon } from "./MapMarkerUtils";
import { Loader2 } from "lucide-react";

// Import Circle from a different source since it's not exported from react-leaflet
import L from "leaflet";

// This component is for dynamically updating the map view
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, map, zoom]);
  
  return null;
};

// This component creates a circle overlay on the map
const CircleOverlay = ({ center, radius, options }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!center || !radius) return;
    
    // Create circle using Leaflet directly
    const circle = L.circle(center, {
      radius,
      ...options
    }).addTo(map);
    
    return () => {
      if (circle) {
        map.removeLayer(circle);
      }
    };
  }, [center, radius, options, map]);
  
  return null;
};

const LazyMapComponent = ({ 
  center, 
  zoom = 13, 
  markerPosition, 
  mapType = "terrain",
  circleOptions = null,
  circleRadius = 0
}) => {
  const [loading, setLoading] = useState(true);
  const wrapperClassName = `relative h-full w-full rounded-md overflow-hidden ${loading ? 'animate-pulse' : ''}`;
  const mapClassName = "h-full w-full rounded-md";
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={wrapperClassName}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
          <Loader2 className="h-6 w-6 animate-spin text-cosmic-100" />
        </div>
      )}
      <Suspense fallback={<div className="h-full w-full bg-cosmic-900/20" />}>
        <MapContainer
          center={center}
          zoom={zoom}
          className={mapClassName}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url={selectMapType(mapType)} />
          {markerPosition && (
            <Marker position={markerPosition} icon={createMarkerIcon()} />
          )}
          <MapUpdater center={center} zoom={zoom} />
          {circleOptions && circleRadius > 0 && center && (
            <CircleOverlay 
              center={center}
              radius={circleRadius}
              options={circleOptions}
            />
          )}
        </MapContainer>
      </Suspense>
    </div>
  );
};

export default LazyMapComponent;
