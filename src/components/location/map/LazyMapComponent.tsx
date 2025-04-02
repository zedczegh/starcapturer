import React, { useCallback, memo, useMemo, useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle as LeafletCircle } from "react-leaflet";
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
  const [isClient, setIsClient] = useState(false);

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

  const tileServerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  
  const getCertificationDetails = useMemo(() => {
    if (!isDarkSkyReserve && !certification) {
      return {
        markerColor: undefined,
        overlayColor: 'rgba(65, 105, 225, 0.15)',
        overlayRadius: 0,
        popupLabel: ''
      };
    }
    
    let details = {
      markerColor: '#3b82f6',
      overlayColor: 'rgba(59, 130, 246, 0.15)',
      overlayRadius: 20000,
      popupLabel: t("Dark Sky Location", "暗夜地点")
    };
    
    const cert = (certification || '').toLowerCase();
    
    if (cert.includes('sanctuary') || cert.includes('reserve')) {
      details = {
        markerColor: '#3b82f6',
        overlayColor: 'rgba(59, 130, 246, 0.15)',
        overlayRadius: 40000,
        popupLabel: t("Dark Sky Reserve", "暗夜保护区")
      };
    } else if (cert.includes('park')) {
      details = {
        markerColor: '#22c55e',
        overlayColor: 'rgba(34, 197, 94, 0.15)',
        overlayRadius: 30000,
        popupLabel: t("Dark Sky Park", "暗夜公园")
      };
    } else if (cert.includes('community')) {
      details = {
        markerColor: '#f59e0b',
        overlayColor: 'rgba(245, 158, 11, 0.15)', 
        overlayRadius: 15000,
        popupLabel: t("Dark Sky Community", "暗夜社区")
      };
    } else if (cert.includes('urban')) {
      details = {
        markerColor: '#a855f7',
        overlayColor: 'rgba(168, 85, 247, 0.15)',
        overlayRadius: 5000,
        popupLabel: t("Urban Night Sky", "城市夜空")
      };
    }
    
    return details;
  }, [isDarkSkyReserve, certification, t]);

  const markerIcon = useMemo(() => {
    if (!isClient) return null;
    
    if (isDarkSkyReserve || certification) {
      return createCustomMarker(getCertificationDetails.markerColor);
    }
    return createCustomMarker();
  }, [isDarkSkyReserve, certification, isClient, getCertificationDetails]);

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
          
          {isDarkSkyReserve && getCertificationDetails.overlayRadius > 0 && (
            <LeafletCircle 
              center={position}
              radius={getCertificationDetails.overlayRadius}
              pathOptions={{
                color: getCertificationDetails.markerColor || '#3b82f6',
                fillColor: getCertificationDetails.overlayColor,
                fillOpacity: 0.3,
                weight: 2,
                opacity: 0.5
              }}
            />
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
