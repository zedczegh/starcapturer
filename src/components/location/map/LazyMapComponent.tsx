import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import { LatLngExpression, Icon, DivIcon } from "leaflet";
import { Loader2, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import "leaflet/dist/leaflet.css";

export interface LazyMapComponentProps {
  latitude: number;
  longitude: number;
  locationName: string;
  editable?: boolean;
  onMapReady?: () => void;
  onMapClick?: (lat: number, lng: number) => void;
  showInfoPanel?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
}

const LazyMapComponent: React.FC<LazyMapComponentProps> = ({
  latitude,
  longitude,
  locationName,
  editable = false,
  onMapReady,
  onMapClick,
  showInfoPanel = true,
  isDarkSkyReserve = false,
  certification = ""
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const { t } = useLanguage();
  const position: LatLngExpression = [latitude, longitude];
  
  // Create a custom marker icon
  const customIcon = new Icon({
    iconUrl: isDarkSkyReserve ? "/markers/reserve-marker.svg" : "/markers/photo-marker.svg",
    iconSize: [28, 41],
    iconAnchor: [14, 41],
    popupAnchor: [0, -41]
  });
  
  // Handle map click events if editable
  const handleMapClick = (e: any) => {
    if (editable && onMapClick) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  };
  
  useEffect(() => {
    if (mapLoaded && onMapReady) {
      onMapReady();
    }
  }, [mapLoaded, onMapReady]);
  
  return (
    <div className="relative w-full h-full min-h-[300px]">
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-cosmic-800/50 z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary/70 mb-2" />
            <p className="text-sm text-muted-foreground">{t("Loading map...", "正在加载地图...")}</p>
          </div>
        </div>
      )}
      
      <MapContainer
        center={position}
        zoom={12}
        style={{ height: "100%", width: "100%", borderRadius: "8px" }}
        whenReady={() => setMapLoaded(true)}
        onClick={handleMapClick}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={position} icon={customIcon}>
          <Popup>
            <div className="text-sm p-1">
              <p className="font-medium">{locationName}</p>
              {(isDarkSkyReserve || certification) && (
                <p className="text-xs mt-1 text-emerald-600">
                  {isDarkSkyReserve ? t("Dark Sky Reserve", "暗夜保护区") : certification}
                </p>
              )}
              <p className="text-xs mt-1 text-gray-500">
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>
        
        {/* Add illumination range indicator for dark sky zones */}
        {(isDarkSkyReserve || certification?.includes("Dark Sky")) && (
          <Circle
            center={position}
            radius={20000} // 20km radius for dark sky reserves
            pathOptions={{ 
              color: '#10B981', 
              fillColor: '#10B981', 
              fillOpacity: 0.1, 
              weight: 1 
            }}
          />
        )}
        
        {/* Update viewport component to keep map centered */}
        <MapUpdater center={position} />
      </MapContainer>
      
      {showInfoPanel && mapLoaded && (
        <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-lg text-xs border border-border z-[400]">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-primary" />
            <span>{t("Click to view details", "点击查看详情")}</span>
          </div>
        </div>
      )}
      
      {editable && mapLoaded && (
        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-lg text-xs border border-border z-[400]">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-primary" />
            <span>{t("Click to set location", "点击设置位置")}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component to update map center when props change
const MapUpdater: React.FC<{ center: LatLngExpression }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
};

export default LazyMapComponent;
