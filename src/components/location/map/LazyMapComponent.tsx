
import React, { useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapUpdater, MapEvents, MapStyles, createCustomMarker } from "./MapComponents";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LazyMapComponentProps {
  position: [number, number];
  locationName: string;
  editable?: boolean;
  onMapReady: () => void;
  onMapClick: (lat: number, lng: number) => void;
  showInfoPanel?: boolean;
}

const LazyMapComponent: React.FC<LazyMapComponentProps> = ({
  position,
  locationName,
  editable = false,
  onMapReady,
  onMapClick,
  showInfoPanel = false
}) => {
  const { t } = useLanguage();

  const handleMapReady = useCallback((event: { target: L.Map }) => {
    onMapReady();
  }, [onMapReady]);

  // Use a China-friendly tile server
  const tileServerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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
          
          <Marker 
            position={position}
            icon={createCustomMarker()}
          >
            <Popup>
              {locationName}
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

export default LazyMapComponent;
