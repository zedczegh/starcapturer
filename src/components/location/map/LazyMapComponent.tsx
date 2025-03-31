
import React, { useCallback, memo, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapUpdater, MapEvents, MapStyles, createCustomMarker } from "./MapComponents";

// Fix for default marker icons - only initialize once
if (!L.Icon.Default.imagePath) {
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

  const handleMapReady = useCallback(() => {
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

  return (
    <>
      <MapStyles />
      <div className="h-full w-full">
        <MapContainer 
          center={position}
          zoom={12} 
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          whenReady={handleMapReady}
          attributionControl={false}
        >
          <TileLayer
            url={tileServerUrl}
            attribution={attribution}
            subdomains={['a', 'b', 'c']}
          />
          
          {/* Add a circle for dark sky reserves to indicate the quality area */}
          {isDarkSkyReserve && (
            <CircleMarker 
              center={position} 
              radius={30} // Visual radius for the marker
              pathOptions={{ 
                fillColor: '#3b82f6', 
                fillOpacity: 0.1, 
                color: '#3b82f6', 
                weight: 1 
              }} 
            />
          )}
          
          <Marker 
            position={position}
            icon={markerIcon}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{locationName}</div>
                {isDarkSkyReserve && certification && (
                  <div className="text-blue-600 text-xs mt-1">
                    {t("Certified Dark Sky Location", "认证暗夜位置")}
                    <div className="font-bold">{certification}</div>
                  </div>
                )}
                <div className="mt-1 text-gray-500">
                  {position[0].toFixed(4)}, {position[1].toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
          
          <MapUpdater position={position} />
          {editable && <MapEvents onMapClick={onMapClick} />}
        </MapContainer>
      </div>
      
      {showInfoPanel && (
        <div className="p-4 bg-cosmic-800/50 border-t border-cosmic-600/10">
          <h3 className="font-medium text-sm mb-1 text-primary-foreground/90">{t("Location", "位置")}</h3>
          <p className="text-sm text-muted-foreground">
            {t(`${locationName} is located at coordinates ${position[0].toFixed(6)}, ${position[1].toFixed(6)}`, 
               `${locationName}位于坐标 ${position[0].toFixed(6)}, ${position[1].toFixed(6)}`)}
          </p>
          
          {/* Show dark sky certification in the info panel */}
          {isDarkSkyReserve && certification && (
            <div className="mt-2 text-sm">
              <span className="text-blue-400 font-medium">
                {t("Dark Sky Certification: ", "暗夜保护认证: ")}
              </span>
              <span className="text-blue-200">{certification}</span>
            </div>
          )}
          
          {editable && (
            <p className="text-xs text-primary/70 mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              {t("Click anywhere on the map to update the location", "点击地图上的任意位置来更新位置")}
            </p>
          )}
        </div>
      )}
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(LazyMapComponent);
