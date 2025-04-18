
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
import { Star, Info } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile"; 
import { getSiqsScore } from "@/utils/siqsHelpers";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
  onLocationUpdate?: (location: { name: string; latitude: number; longitude: number }) => void;
  editable?: boolean;
  showInfoPanel?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
  siqs?: number | { score: number; isViable: boolean } | any;
}

const LocationMap: React.FC<LocationMapProps> = ({ 
  latitude, 
  longitude, 
  name,
  onLocationUpdate,
  editable = false,
  showInfoPanel = false,
  isDarkSkyReserve = false,
  certification = "",
  siqs
}) => {
  const { language, t } = useLanguage();
  const isMobile = useIsMobile();
  const [position, setPosition] = useState<[number, number]>([
    isFinite(latitude) ? latitude : 0, 
    isFinite(longitude) ? longitude : 0
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [updateRetries, setUpdateRetries] = useState(0);
  
  const { setCachedData, getCachedData } = useLocationDataCache();
  const cacheService: LocationCacheService = {
    setCachedData: (key, data) => setCachedData(key, data),
    getCachedData: (key) => getCachedData(key)
  };

  const validLatitude = isFinite(latitude) ? latitude : 0;
  const validLongitude = isFinite(longitude) ? longitude : 0;
  const validName = name || t("Unknown Location", "未知位置");
  
  // Extract SIQS score using our consistent helper function
  const siqsScore = getSiqsScore(siqs);

  useEffect(() => {
    if (isFinite(latitude) && isFinite(longitude) && 
       (validLatitude !== position[0] || validLongitude !== position[1])) {
      setPosition([validLatitude, validLongitude]);
    }
  }, [validLatitude, validLongitude, position]);

  const handleMapReady = useCallback(() => {
    setIsLoading(false);
    setMapError(null);
  }, []);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    // Always allow map clicks on mobile, regardless of editable state
    if (!editable && !isMobile) return;
    if (!onLocationUpdate) return;
    
    console.log("Map clicked at:", lat, lng);
    
    const validLat = Math.max(-90, Math.min(90, lat));
    const validLng = normalizeLongitude(lng);
    
    setPosition([validLat, validLng]);
    
    try {
      setLocationLoading(true);
      setUpdateRetries(prev => prev + 1);

      const locationName = await getLocationNameForCoordinates(validLat, validLng, language, cacheService);
      
      if (onLocationUpdate) {
        onLocationUpdate({
          name: locationName,
          latitude: validLat,
          longitude: validLng
        });
      }

      setUpdateRetries(0);
    } catch (error) {
      console.error("Error getting location name:", error);
      if (onLocationUpdate && updateRetries >= 2) {
        const fallbackName = t("Location", "位置") + ` ${validLat.toFixed(4)}, ${validLng.toFixed(4)}`;
        onLocationUpdate({
          name: fallbackName,
          latitude: validLat,
          longitude: validLng
        });
      }
    } finally {
      setLocationLoading(false);
    }
  }, [editable, onLocationUpdate, language, cacheService, t, updateRetries, isMobile]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading && !mapError) {
        setMapError(t("Failed to load map. Please try refreshing the page.", 
                    "无法加载地图。请尝试刷新页面。"));
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [isLoading, t, mapError]);

  return (
    <div className="space-y-2">
      <div className="aspect-video w-full h-[300px] relative">
        {(isLoading || locationLoading) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-primary-foreground/90">
                {locationLoading 
                  ? t("Updating location...", "正在更新位置...") 
                  : t("Loading map...", "正在加载地图...")}
              </p>
            </div>
          </div>
        )}
        
        {mapError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-destructive/10 backdrop-blur-sm">
            <div className="bg-card p-4 rounded-md shadow-lg max-w-[80%] text-center">
              <p className="text-destructive font-medium">{mapError}</p>
              <button
                className="mt-3 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"
                onClick={() => window.location.reload()}
              >
                {t("Refresh Page", "刷新页面")}
              </button>
            </div>
          </div>
        )}
        
        <MapDisplay
          position={position}
          locationName={validName}
          editable={editable || isMobile} // Enable editable for mobile
          onMapReady={handleMapReady}
          onMapClick={handleMapClick}
          showInfoPanel={showInfoPanel}
          isDarkSkyReserve={isDarkSkyReserve}
          certification={certification}
          siqs={siqs} // Pass full SIQS object for consistent processing
        />
      </div>
      
      {(isDarkSkyReserve || certification) && (
        <div className="flex items-center bg-background/90 px-3 py-2 rounded-md border border-border shadow-sm">
          <div className="bg-muted/30 p-1 rounded-full mr-2">
            <Star className="h-3.5 w-3.5 text-[#9b87f5] fill-[#9b87f5]" />
          </div>
          <span className="text-xs text-foreground/80">
            {t("Certified Dark Sky Location", "认证暗夜地点")}
            {certification && <span className="ml-1 font-medium text-primary/90">{certification}</span>}
          </span>
        </div>
      )}
    </div>
  );
};

export default memo(LocationMap);
