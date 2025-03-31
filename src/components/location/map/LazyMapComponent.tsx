
import React, { useCallback, memo, useMemo, useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  MapUpdater, 
  MapEvents, 
  MapStyles, 
  createCustomMarker,
  DarkSkyOverlay
} from "./MapComponents";

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
  // Use state to track client-side rendering
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side rendering is detected
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMapReady = useCallback((map: L.Map) => {
    if (!map) return;
    
    try {
      mapRef.current = map;
      onMapReady();
      console.log("Map ready with Leaflet version:", L.version);
    } catch (error) {
      console.error("Error handling map ready event:", error);
    }
  }, [onMapReady]);

  // Use a China-friendly tile server
  const tileServerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  
  // Memoize marker icon to avoid recreating on each render
  const markerIcon = useMemo(() => {
    // Only create marker icon on client-side
    if (!isClient) return null;
    
    // Use a special icon for dark sky reserves
    if (isDarkSkyReserve) {
      return createCustomMarker('#3b82f6'); // Blue color for dark sky locations
    }
    return createCustomMarker(); // Default icon for regular locations
  }, [isDarkSkyReserve, isClient]);

  // Skip rendering map until client-side
  if (!isClient) {
    return <div className="h-full w-full bg-cosmic-900/30 rounded-lg animate-pulse"></div>;
  }

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
          
          {markerIcon && (
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
          )}
          
          <MapUpdater position={position} />
          
          {isDarkSkyReserve && (
            <DarkSkyOverlay 
              isDarkSkyReserve={isDarkSkyReserve} 
              position={position} 
            />
          )}
          
          {editable && <MapEvents onMapClick={onMapClick} />}
        </MapContainer>
      </div>
    </>
  );
};

export default memo(LazyMapComponent);
