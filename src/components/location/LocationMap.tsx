
import React, { useState, useEffect, useCallback, memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import MapDisplay from "./MapDisplay";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { 
  getLocationNameForCoordinates, 
  normalizeLongitude,
  type LocationCacheService
} from "./map/LocationNameService";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
  onLocationUpdate?: (location: { name: string; latitude: number; longitude: number }) => void;
  editable?: boolean;
  showInfoPanel?: boolean;
}

const LocationMap: React.FC<LocationMapProps> = ({ 
  latitude, 
  longitude, 
  name,
  onLocationUpdate,
  editable = false,
  showInfoPanel = false
}) => {
  const { language, t } = useLanguage();
  const [position, setPosition] = useState<[number, number]>([
    isFinite(latitude) ? latitude : 0, 
    isFinite(longitude) ? longitude : 0
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Create cache service
  const { setCachedData, getCachedData } = useLocationDataCache();
  const cacheService: LocationCacheService = {
    setCachedData: (key, data) => setCachedData(key, data),
    getCachedData: (key) => getCachedData(key)
  };

  // Update position when props change
  useEffect(() => {
    if (isFinite(latitude) && isFinite(longitude) && 
       (latitude !== position[0] || longitude !== position[1])) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude, position]);

  const handleMapReady = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    if (!editable || !onLocationUpdate) return;
    
    // Ensure valid coordinates
    const validLat = Math.max(-90, Math.min(90, lat));
    const validLng = normalizeLongitude(lng);
    
    setPosition([validLat, validLng]);
    
    setLocationLoading(true);
    const locationName = await getLocationNameForCoordinates(validLat, validLng, language, cacheService);
    setLocationLoading(false);
    
    onLocationUpdate({
      name: locationName,
      latitude: validLat,
      longitude: validLng
    });
  }, [editable, onLocationUpdate, language, cacheService]);

  // Handle map initialization error
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading && !mapError) {
        setMapError(t("Failed to load map. Please try refreshing the page.", 
                    "无法加载地图。请尝试刷新页面。"));
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [isLoading, t, mapError]);

  // Validate and default props
  const validLatitude = isFinite(latitude) ? latitude : 0;
  const validLongitude = isFinite(longitude) ? longitude : 0;
  const validName = name || t("Unknown Location", "未知位置");

  return (
    <div className="aspect-video w-full h-[300px] relative">
      {(isLoading || locationLoading) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-500">
          <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-cosmic-800/70 border border-cosmic-600/20 shadow-lg">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-primary-foreground font-medium tracking-wide">
              {locationLoading 
                ? t("Retrieving location data...", "正在获取位置数据...")
                : t("Initializing map...", "正在初始化地图...")}
            </p>
          </div>
        </div>
      )}
      
      <MapDisplay 
        position={[validLatitude, validLongitude]}
        locationName={validName}
        editable={editable}
        onMapReady={handleMapReady}
        onMapClick={handleMapClick}
        showInfoPanel={showInfoPanel}
      />
      
      {mapError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="p-4 text-center max-w-xs bg-cosmic-800/70 border border-destructive/30 rounded-lg shadow-lg">
            <p className="text-destructive font-medium">{mapError}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t("Please refresh the page or try again later.", "请刷新页面或稍后再试。")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(LocationMap);
