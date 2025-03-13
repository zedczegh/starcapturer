
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { getLocationNameFromCoordinates } from "@/lib/api";
import { findClosestKnownLocation } from "@/utils/locationUtils";
import { useLocationDataCache } from "@/hooks/useLocationData";

// Fix for default marker icons - essential for Leaflet to show markers correctly
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
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      try {
        // Gentle panning instead of immediate view change to prevent jarring transitions
        map.panTo(position, { animate: true, duration: 0.5 });
      } catch (error) {
        console.error("Error updating map view:", error);
      }
    }
  }, [position, map]);
  
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
  const [position, setPosition] = useState<[number, number]>([
    isFinite(latitude) ? latitude : 0, 
    isFinite(longitude) ? longitude : 0
  ]);
  const mapRef = useRef<L.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const { setCachedData, getCachedData } = useLocationDataCache();

  // Handle potential invalid coordinates with safer defaults
  const validLatitude = isFinite(latitude) ? latitude : 0;
  const validLongitude = isFinite(longitude) ? longitude : 0;
  const validName = name || t("Unknown Location", "未知位置");

  // Update position when props change
  useEffect(() => {
    if (isFinite(latitude) && isFinite(longitude) && 
       (validLatitude !== position[0] || validLongitude !== position[1])) {
      setPosition([validLatitude, validLongitude]);
    }
  }, [validLatitude, validLongitude]);

  // Function to normalize longitude to -180 to 180 range
  const normalizeLongitude = (lng: number): number => {
    return ((lng + 180) % 360 + 360) % 360 - 180;
  };

  // Get location name for clicked position
  const getLocationNameForCoordinates = async (lat: number, lng: number): Promise<string> => {
    setLocationLoading(true);
    try {
      // Check cache first
      const cacheKey = `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`;
      const cachedData = getCachedData(cacheKey);
      
      if (cachedData && cachedData.name) {
        setLocationLoading(false);
        return cachedData.name;
      }
      
      // Try from database first
      const closestLocation = findClosestKnownLocation(lat, lng);
      
      // If location is within 20km of a known location, use that name
      if (closestLocation.distance <= 20) {
        const locationName = closestLocation.name;
        
        // Cache this data
        setCachedData(cacheKey, {
          name: locationName,
          bortleScale: closestLocation.bortleScale
        });
        
        setLocationLoading(false);
        return locationName;
      }
      
      // Otherwise try to get a name from API
      const name = await getLocationNameFromCoordinates(lat, lng, language);
      
      // Cache this data
      setCachedData(cacheKey, {
        name,
        bortleScale: 4 // Default, will be updated later if needed
      });
      
      setLocationLoading(false);
      return name;
    } catch (error) {
      console.error("Error getting location name for coordinates:", error);
      
      // Fallback to coordinates format
      setLocationLoading(false);
      return t(`Location at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`, 
               `位置在 ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    }
  };

  // Interactive map component that handles clicks
  const MapEvents = () => {
    const map = useMap();
    
    // Set up click handler
    useEffect(() => {
      if (!editable || !map) return;
      
      const handleClick = async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        
        // Ensure latitude is in valid range (-90 to 90)
        const validLat = Math.max(-90, Math.min(90, lat));
        // Ensure longitude is in valid range (-180 to 180)
        const validLng = normalizeLongitude(lng);
        
        setPosition([validLat, validLng]);
        
        if (onLocationUpdate) {
          // Get proper location name instead of just coordinates
          const locationName = await getLocationNameForCoordinates(validLat, validLng);
          
          onLocationUpdate({
            name: locationName,
            latitude: validLat,
            longitude: validLng
          });
        }
      };
      
      map.on('click', handleClick);
      
      return () => {
        map.off('click', handleClick);
      };
    }, [map, editable]);
    
    return null;
  };

  const handleMapReady = (event: { target: L.Map }) => {
    console.log("Map instance created and ready");
    mapRef.current = event.target;
    setIsLoading(false);
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
    
    // Cleanup function for the map in case component unmounts
    return () => {
      if (mapRef.current) {
        console.log("Cleaning up map instance");
        mapRef.current = null;
      }
    };
  }, []);

  // Handle map initialization error
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading && !mapRef.current) {
        console.error("Map failed to initialize within timeout period");
        setMapError(t("Failed to load map. Please try refreshing the page.", 
                     "无法加载地图。请尝试刷新页面。"));
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [isLoading, t]);

  return (
    <Card>
      <CardContent className="p-0 overflow-hidden rounded-md">
        <div className="aspect-video w-full h-[300px] relative">
          {(isLoading || locationLoading) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
              <div className="flex flex-col items-center gap-2">
                <Loader className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {locationLoading 
                    ? t("Getting location name...", "正在获取位置名称...")
                    : t("Loading map...", "正在加载地图...")}
                </p>
              </div>
            </div>
          )}
          
          <MapContainer 
            center={position}
            zoom={12} 
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            whenReady={handleMapReady}
            attributionControl={false}
          >
            {/* Base Map Layer - OpenStreetMap */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              subdomains={['a', 'b', 'c']}
            />
            
            {/* Light Pollution Overlay Layer */}
            <TileLayer
              url="https://tiles.lightpollutionmap.info/tiles/world_atlas_2015/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.lightpollutionmap.info">Light Pollution Map</a>'
              opacity={0.6}
              zIndex={10}
            />
            
            <Marker 
              position={position}
              icon={createCustomMarker()}
            >
              <Popup>
                {validName}
              </Popup>
            </Marker>
            <MapUpdater position={position} />
            {editable && <MapEvents />}
          </MapContainer>
          
          {mapError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
              <div className="p-4 text-center">
                <p className="text-destructive font-medium">{mapError}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("Please refresh the page or try again later.", "请刷新页面或稍后再试。")}
                </p>
              </div>
            </div>
          )}
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
