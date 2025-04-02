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
  
  // Determine marker color and overlay properties based on certification type
  const getCertificationDetails = useMemo(() => {
    if (!isDarkSkyReserve && !certification) {
      return {
        markerColor: undefined, // Default
        overlayColor: 'rgba(65, 105, 225, 0.15)',
        overlayRadius: 0, // No overlay
        popupLabel: ''
      };
    }
    
    // Set default values for dark sky locations
    let details = {
      markerColor: '#3b82f6', // Blue default for dark sky locations
      overlayColor: 'rgba(59, 130, 246, 0.15)',
      overlayRadius: 20000, // 20km radius default
      popupLabel: t("Dark Sky Location", "暗夜地点")
    };
    
    // Customize based on certification type
    const cert = (certification || '').toLowerCase();
    
    if (cert.includes('sanctuary') || cert.includes('reserve')) {
      details = {
        markerColor: '#3b82f6', // Blue for reserves
        overlayColor: 'rgba(59, 130, 246, 0.15)',
        overlayRadius: 40000, // 40km radius for reserves
        popupLabel: t("Dark Sky Reserve", "暗夜保护区")
      };
    } else if (cert.includes('park')) {
      details = {
        markerColor: '#22c55e', // Green for parks
        overlayColor: 'rgba(34, 197, 94, 0.15)',
        overlayRadius: 30000, // 30km radius for parks
        popupLabel: t("Dark Sky Park", "暗夜公园")
      };
    } else if (cert.includes('community')) {
      details = {
        markerColor: '#f59e0b', // Amber for communities
        overlayColor: 'rgba(245, 158, 11, 0.15)', 
        overlayRadius: 15000, // 15km radius for communities
        popupLabel: t("Dark Sky Community", "暗夜社区")
      };
    } else if (cert.includes('urban')) {
      details = {
        markerColor: '#a855f7', // Purple for urban night sky places
        overlayColor: 'rgba(168, 85, 247, 0.15)',
        overlayRadius: 5000, // 5km radius for urban places
        popupLabel: t("Urban Night Sky", "城市夜空")
      };
    }
    
    return details;
  }, [isDarkSkyReserve, certification, t]);

  // Memoize marker icon to avoid recreating on each render
  const markerIcon = useMemo(() => {
    // Only create marker icon on client-side
    if (!isClient) return null;
    
    // Use certification-specific color if available
    if (isDarkSkyReserve || certification) {
      return createCustomMarker(getCertificationDetails.markerColor);
    }
    return createCustomMarker(); // Default icon for regular locations
  }, [isDarkSkyReserve, certification, isClient, getCertificationDetails]);

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
          
          {/* Add a Circle for certified locations */}
          {isDarkSkyReserve && getCertificationDetails.overlayRadius > 0 && (
            <>
              {/* Circle is created in DarkSkyOverlay component using Leaflet directly */}
              <DarkSkyOverlay 
                isDarkSkyReserve={true}
                position={position}
              />
            </>
          )}
          
          {markerIcon && (
            <Marker 
              position={position}
              icon={markerIcon}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{locationName}</strong>
                  {(isDarkSkyReserve || certification) && (
                    <div className="mt-1 text-blue-400 text-xs">
                      {getCertificationDetails.popupLabel || certification || t("Dark Sky Reserve", "暗夜保护区")}
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
