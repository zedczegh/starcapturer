
import React, { useCallback, memo, useMemo, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapUpdater, MapEvents, MapStyles, createCustomMarker } from "./MapComponents";

// Fix for default marker icons - only initialize once
if (typeof window !== 'undefined') {
  // Only run this on the client side
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

interface LazyMapComponentProps {
  position: [number, number];
  locationName: string;
  editable?: boolean;
  onMapReady: () => void;
  onMapClick: (lat: number, lng: number) => void;
  showInfoPanel?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
}

const LazyMapComponent: React.FC<LazyMapComponentProps> = ({
  position,
  locationName,
  editable = false,
  onMapReady,
  onMapClick,
  showInfoPanel = false,
  isDarkSkyReserve = false,
  certification = ''
}) => {
  const { t } = useLanguage();
  const mapRef = useRef<L.Map | null>(null);

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    onMapReady();
  }, [onMapReady]);

  // Use a China-friendly tile server
  const tileServerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  
  // Memoize marker icon to avoid recreating on each render
  const markerIcon = useMemo(() => {
    // Use a special icon for dark sky reserves
    if (isDarkSkyReserve) {
      return createCustomMarker('#3b82f6'); // Blue color for dark sky locations
    }
    return createCustomMarker(); // Default icon for regular locations
  }, [isDarkSkyReserve]);

  // Create a circle for dark sky reserves using useEffect to ensure map is available
  useEffect(() => {
    if (!isDarkSkyReserve || !mapRef.current) return;
    
    // Create a circular overlay for the dark sky region
    const circle = L.circle(position, {
      radius: 10000, // 10km radius
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 1
    }).addTo(mapRef.current);
    
    return () => {
      if (circle && mapRef.current) {
        circle.remove();
      }
    };
  }, [isDarkSkyReserve, position, mapRef.current]);

  return (
    <>
      <MapStyles />
      <div className="h-full w-full">
        <MapContainer 
          center={position}
          zoom={12} 
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          whenReady={(map) => handleMapReady(map.target)}
          attributionControl={false}
          ref={mapRef}
        >
          <TileLayer
            url={tileServerUrl}
            attribution={attribution}
            subdomains={['a', 'b', 'c']}
          />
          
          <Marker 
            position={position}
            icon={markerIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>{locationName}</strong>
                {isDarkSkyReserve && (
                  <div className="mt-1 text-blue-400 text-xs">
                    {certification || t("Dark Sky Reserve", "暗夜保护区")}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
          
          <MapUpdater position={position} />
          
          {editable && <MapEvents onMapClick={onMapClick} />}
        </MapContainer>
      </div>
    </>
  );
};

export default LazyMapComponent;
