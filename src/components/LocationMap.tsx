
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getLocationNameFromCoordinates } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import OfflineMapControl from "./OfflineMapControl";
import offlineMapService from "@/services/OfflineMapService";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Create a custom marker with animation effects
const createCustomMarker = (): L.DivIcon => {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div class="marker-pin-container">
        <div class="marker-pin animate-bounce"></div>
        <div class="marker-shadow"></div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42]
  });
};

// Component to update the map view when position changes
const MapUpdater = ({ position }: { position: [number, number] }) => {
  const mapRef = useRef<L.Map | null>(null);
  
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(position, mapRef.current.getZoom());
    }
  }, [position]);
  
  // Use MapEvents to capture the map instance
  useMapEvents({
    load: (e) => {
      mapRef.current = e.target;
    }
  });
  
  return null;
};

interface LocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
  onLocationUpdate?: (location: { name: string; latitude: number; longitude: number }) => void;
  editable?: boolean;
}

const LocationMap: React.FC<LocationMapProps> = ({ 
  latitude, 
  longitude, 
  name,
  onLocationUpdate,
  editable = false 
}) => {
  const { language, t } = useLanguage();
  const [position, setPosition] = useState<[number, number]>([latitude, longitude]);
  const mapRef = useRef<L.Map | null>(null);

  // Handle potential invalid coordinates with safer defaults
  const validLatitude = latitude !== undefined && isFinite(latitude) ? latitude : 0;
  const validLongitude = longitude !== undefined && isFinite(longitude) ? longitude : 0;
  const validName = name || t("Unknown Location", "未知位置");

  // Update position when props change
  useEffect(() => {
    if (validLatitude !== position[0] || validLongitude !== position[1]) {
      setPosition([validLatitude, validLongitude]);
    }
  }, [validLatitude, validLongitude]);

  // Function to normalize longitude to -180 to 180 range
  const normalizeLongitude = (lng: number): number => {
    // Handle cases where longitude is outside -180 to 180 range
    return ((lng + 180) % 360 + 360) % 360 - 180;
  };

  // Store map instance when it's created
  const handleMapCreated = (map: L.Map) => {
    mapRef.current = map;
  };

  // Interactive map component that handles clicks
  const MapEvents = () => {
    useMapEvents({
      click: async (e: L.LeafletMouseEvent) => {
        if (!editable) return;
        
        const { lat, lng } = e.latlng;
        
        // Ensure latitude is in valid range (-90 to 90)
        const validLat = Math.max(-90, Math.min(90, lat));
        // Ensure longitude is in valid range (-180 to 180)
        const validLng = normalizeLongitude(lng);
        
        setPosition([validLat, validLng]);
        
        try {
          const newName = await getLocationNameFromCoordinates(validLat, validLng, language as 'en' | 'zh');
          
          if (onLocationUpdate) {
            onLocationUpdate({
              name: newName,
              latitude: validLat,
              longitude: validLng
            });
          }
          
          toast.success(t("Location Updated", "位置已更新"), {
            description: t(`New location: ${newName}`, `新位置：${newName}`),
            position: "top-center",
            duration: 3000
          });
        } catch (error) {
          console.error('Error getting location name:', error);
          const fallbackName = t(
            `Location at ${validLat.toFixed(4)}°N, ${validLng.toFixed(4)}°E`,
            `位置：${validLat.toFixed(4)}°N, ${validLng.toFixed(4)}°E`
          );
          
          if (onLocationUpdate) {
            onLocationUpdate({
              name: fallbackName,
              latitude: validLat,
              longitude: validLng
            });
          }
          
          toast.error(t("Location Error", "位置错误"), {
            description: t("Could not get location name. Using coordinates instead.", 
                          "无法获取位置名称。使用坐标代替。"),
            position: "top-center",
            duration: 5000
          });
        }
      },
    });
    
    return null;
  };

  // Effect to add custom CSS for marker animation if not already present
  useEffect(() => {
    if (!document.getElementById('custom-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'custom-marker-styles';
      style.innerHTML = `
        .custom-marker-icon {
          background: transparent;
          border: none;
        }
        .marker-pin-container {
          position: relative;
          width: 30px;
          height: 42px;
        }
        .marker-pin {
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          background: #9b87f5;
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -20px 0 0 -12px;
          box-shadow: 0 0 6px rgba(0,0,0,0.3);
        }
        .marker-pin::after {
          content: '';
          width: 14px;
          height: 14px;
          margin: 5px 0 0 5px;
          background: white;
          position: absolute;
          border-radius: 50%;
        }
        .marker-shadow {
          width: 24px;
          height: 6px;
          border-radius: 50%;
          background: rgba(0,0,0,0.15);
          position: absolute;
          left: 50%;
          top: 100%;
          margin: -6px 0 0 -12px;
          transform: rotateX(55deg);
          z-index: -1;
        }
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(155, 135, 245, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(155, 135, 245, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(155, 135, 245, 0);
          }
        }
        .animate-bounce {
          animation: pulse 2s infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <Card>
      <CardContent className="p-0 overflow-hidden rounded-md">
        <div className="aspect-video w-full h-[300px]">
          <MapContainer 
            center={position}
            zoom={12} 
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            whenCreated={handleMapCreated}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              // Use the offline map service to handle tile loading
              {...(offlineMapService.createTileLayer as any)}
            />
            <Marker 
              position={position}
              icon={createCustomMarker()}
            />
            <MapUpdater position={position} />
            {editable && <MapEvents />}
            
            {/* Add controls in the top-right corner */}
            <div className="leaflet-top leaflet-right" style={{ zIndex: 1000, margin: '10px' }}>
              <div className="leaflet-control leaflet-bar flex gap-2">
                <OfflineMapControl mapRef={mapRef} />
              </div>
            </div>
          </MapContainer>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-sm mb-1">{t("Location", "位置")}</h3>
          <p className="text-sm text-muted-foreground">
            {t(`${validName} is located at coordinates ${validLatitude.toFixed(6)}, ${validLongitude.toFixed(6)}`, 
               `${validName}位于坐标 ${validLatitude.toFixed(6)}, ${validLongitude.toFixed(6)}`)}
          </p>
          {editable && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#9b87f5] animate-pulse"></span>
              {t("Click anywhere on the map to update the location", "点击地图上的任意位置来更新位置")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationMap;
