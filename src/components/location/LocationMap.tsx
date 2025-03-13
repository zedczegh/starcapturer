
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import MapDisplay from "./MapDisplay";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { getLocationNameFromCoordinates } from "@/lib/api";
import { findClosestKnownLocation } from "@/utils/locationUtils";

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
  }, [validLatitude, validLongitude, position]);

  // Function to normalize longitude to -180 to 180 range
  const normalizeLongitude = (lng: number): number => {
    return ((lng + 180) % 360 + 360) % 360 - 180;
  };

  // Enhanced function to get a proper location name with administrative hierarchy
  const getLocationNameForCoordinates = async (lat: number, lng: number): Promise<string> => {
    setLocationLoading(true);
    try {
      // Check cache first
      const cacheKey = `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`;
      const cachedData = getCachedData(cacheKey);
      
      if (cachedData && cachedData.name && !cachedData.name.includes("°")) {
        setLocationLoading(false);
        return cachedData.name;
      }
      
      // Try external API for reverse geocoding first
      try {
        const locationName = await getLocationNameFromCoordinates(lat, lng, language);
        if (locationName && !locationName.includes("°")) {
          // Cache this data
          setCachedData(cacheKey, {
            name: locationName,
            formattedName: locationName
          });
          
          setLocationLoading(false);
          return locationName;
        }
      } catch (apiError) {
        console.error("Error getting location name from API:", apiError);
      }
      
      // Try from database as fallback
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
      
      // If we still don't have a proper name, create a formatted name based on the closest known location
      if (closestLocation.distance <= 100) {
        const distanceText = language === 'en' ? 
          `Near ${closestLocation.name}` : 
          `${closestLocation.name}附近`;
        
        // Cache this data
        setCachedData(cacheKey, {
          name: distanceText,
          bortleScale: closestLocation.bortleScale
        });
        
        setLocationLoading(false);
        return distanceText;
      }
      
      // Last resort: use a generic format with region information if available
      const formattedName = t(`Location at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`, 
                            `位置在 ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
                            
      // Cache this generic name
      setCachedData(cacheKey, {
        name: formattedName,
        bortleScale: 4 // Default value
      });
      
      setLocationLoading(false);
      return formattedName;
    } catch (error) {
      console.error("Error getting location name for coordinates:", error);
      
      // Fallback to coordinates format
      setLocationLoading(false);
      return t(`Location at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`, 
              `位置在 ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    }
  };

  const handleMapReady = () => {
    setIsLoading(false);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (!editable || !onLocationUpdate) return;
    
    // Ensure latitude is in valid range (-90 to 90)
    const validLat = Math.max(-90, Math.min(90, lat));
    // Ensure longitude is in valid range (-180 to 180)
    const validLng = normalizeLongitude(lng);
    
    setPosition([validLat, validLng]);
    
    // Get proper location name instead of just coordinates
    const locationName = await getLocationNameForCoordinates(validLat, validLng);
    
    onLocationUpdate({
      name: locationName,
      latitude: validLat,
      longitude: validLng
    });
  };

  // Handle map initialization error
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading && !mapError) {
        setMapError(t("Failed to load map. Please try refreshing the page.", 
                    "无法加载地图。请尝试刷新页面。"));
      }
    }, 5000); // Reduced from 10s to 5s
    
    return () => clearTimeout(timeoutId);
  }, [isLoading, t, mapError]);

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
        position={position}
        locationName={validName}
        editable={editable}
        onMapReady={handleMapReady}
        onMapClick={handleMapClick}
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
      
      <div className="p-4 bg-cosmic-800/50 border-t border-cosmic-600/10">
        <h3 className="font-medium text-sm mb-1 text-primary-foreground/90">{t("Location", "位置")}</h3>
        <p className="text-sm text-muted-foreground">
          {t(`${validName} is located at coordinates ${validLatitude.toFixed(6)}, ${validLongitude.toFixed(6)}`, 
             `${validName}位于坐标 ${validLatitude.toFixed(6)}, ${validLongitude.toFixed(6)}`)}
        </p>
        {editable && (
          <p className="text-xs text-primary/70 mt-2 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            {t("Click anywhere on the map to update the location", "点击地图上的任意位置来更新位置")}
          </p>
        )}
      </div>
    </div>
  );
};

export default LocationMap;
