
import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";

interface GaodeLocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
  onLocationUpdate?: (location: { name: string; latitude: number; longitude: number }) => void;
  editable?: boolean;
}

// Declare AMap as a global variable since it's loaded via script
declare global {
  interface Window {
    AMap: any;
  }
}

const GaodeLocationMap: React.FC<GaodeLocationMapProps> = ({
  latitude,
  longitude,
  name,
  onLocationUpdate,
  editable = false
}) => {
  const { language, t } = useLanguage();
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Note: For production, use a server-side proxy to hide the key or use environment variables
  const GAODE_API_KEY = '2037ca2420bdfcf4319725f57c9c1739';

  // Convert WGS84 coordinates to GCJ02 (required for Gaode Maps)
  const convertToGCJ02 = (lat: number, lng: number) => {
    // This is a simplified conversion - in production, use a proper conversion library
    return { lat, lng };
  };

  const { lat, lng } = convertToGCJ02(latitude, longitude);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous map instance
    if (mapRef.current) {
      mapRef.current.destroy();
      mapRef.current = null;
      setMap(null);
      setMarker(null);
    }

    setLoading(true);
    setError(null);

    // Load Gaode Maps script dynamically
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${GAODE_API_KEY}&plugin=AMap.Geocoder,AMap.ToolBar,AMap.Scale`;
    script.async = true;
    script.onerror = () => {
      setError(t("Failed to load map service", "加载地图服务失败"));
      setLoading(false);
      setStatusMessage(t("Could not load the map service. Please try again later.", "无法加载地图服务，请稍后重试。"));
    };

    script.onload = () => {
      try {
        if (!window.AMap) {
          throw new Error('AMap not loaded');
        }

        // Initialize map
        const newMap = new window.AMap.Map(containerRef.current, {
          zoom: 13,
          center: [lng, lat],
          resizeEnable: true
        });

        // Add controls
        newMap.addControl(new window.AMap.ToolBar());
        newMap.addControl(new window.AMap.Scale());

        // Create marker
        const newMarker = new window.AMap.Marker({
          position: [lng, lat],
          draggable: editable,
          animation: 'AMAP_ANIMATION_DROP'
        });

        newMarker.setMap(newMap);
        mapRef.current = newMap;
        setMap(newMap);
        setMarker(newMarker);

        if (editable) {
          // Handle map clicks for location updates
          newMap.on('click', async (e: any) => {
            const clickLng = e.lnglat.getLng();
            const clickLat = e.lnglat.getLat();
            newMarker.setPosition([clickLng, clickLat]);

            if (onLocationUpdate) {
              try {
                const geocoder = new window.AMap.Geocoder();
                geocoder.getAddress([clickLng, clickLat], (status: string, result: any) => {
                  if (status === 'complete' && result.regeocode) {
                    const newName = result.regeocode.formattedAddress;
                    onLocationUpdate({
                      name: newName,
                      latitude: clickLat,
                      longitude: clickLng
                    });
                    setStatusMessage(t(`New location: ${newName}`, `新位置：${newName}`));
                  } else {
                    const fallbackName = t(
                      `Location at ${clickLat.toFixed(4)}°N, ${clickLng.toFixed(4)}°E`,
                      `位置：${clickLat.toFixed(4)}°N, ${clickLng.toFixed(4)}°E`
                    );
                    onLocationUpdate({
                      name: fallbackName,
                      latitude: clickLat,
                      longitude: clickLng
                    });
                  }
                });
              } catch (error) {
                console.error('Error updating location:', error);
                setStatusMessage(t("Could not get location name. Using coordinates instead.", 
                              "无法获取位置名称。使用坐标代替。"));
              }
            }
          });
        }

        setLoading(false);

      } catch (err) {
        console.error('Error initializing map:', err);
        setError(t("Failed to initialize map", "初始化地图失败"));
        setLoading(false);
        setStatusMessage(t("Could not initialize the map. Please try again later.", 
                      "无法初始化地图，请稍后重试。"));
      }
    };

    document.head.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      // Remove script tag on cleanup
      document.head.removeChild(script);
    };
  }, [t, editable, onLocationUpdate]);

  // Update marker position when coordinates change
  useEffect(() => {
    if (marker && map) {
      const { lat: newLat, lng: newLng } = convertToGCJ02(latitude, longitude);
      marker.setPosition([newLng, newLat]);
      map.setCenter([newLng, newLat]);
    }
  }, [latitude, longitude, marker, map]);

  return (
    <Card>
      <CardContent className="p-0 overflow-hidden rounded-md">
        <div className="aspect-video w-full h-[300px] relative">
          {statusMessage && (
            <div className="absolute top-0 left-0 right-0 z-50 bg-background/80 p-2 text-sm">
              {statusMessage}
            </div>
          )}
          
          <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
          
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <div className="flex flex-col items-center gap-2">
                <Loader className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {t("Loading map...", "正在加载地图...")}
                </p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <p className="text-destructive font-semibold">{error}</p>
                <p className="text-sm text-muted-foreground">
                  {t("Please check your internet connection and try again.", 
                     "请检查您的网络连接并重试。")}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-sm mb-1">{t("Location", "位置")}</h3>
          <p className="text-sm text-muted-foreground">
            {t(`${name} is located at coordinates ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, 
               `${name}位于坐标 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)}
          </p>
          {editable && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              {t("Click anywhere on the map to update the location", "点击地图上的任意位置来更新位置")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GaodeLocationMap;
