import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import { findClosestKnownLocation } from "@/utils/locationUtils";
import { useLocationDataCache } from "@/hooks/useLocationData";
import { getLocationNameFromCoordinates } from "@/lib/api";

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
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      try {
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
      
      if (cachedData && typeof cachedData === 'object' && 'name' in cachedData && typeof cachedData.name === 'string' && !cachedData.name.includes("°")) {
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
    mapRef.current = event.target;
    setIsLoading(false);
  };

  // Effect to add custom CSS for marker animation
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
    
    return () => {
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, []);

  // Handle map initialization error
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading && !mapRef.current) {
        setMapError(t("Failed to load map. Please try refreshing the page.", 
                     "无法加载地图。请尝试刷新页面。"));
      }
    }, 5000); // Reduced from 10s to 5s
    
    return () => clearTimeout(timeoutId);
  }, [isLoading, t]);

  // Use a China-friendly tile server
  const tileServerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div>Map Component</div>
  );
};

export default LocationMap;
