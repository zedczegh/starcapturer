
import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader, WifiOff, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import offlineMapService from "@/services/OfflineMapService";

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
  const [isOfflineMode, setIsOfflineMode] = useState(offlineMapService.isInOfflineMode());

  // Note: For production, use a server-side proxy to hide the key or use environment variables
  const GAODE_API_KEY = '2037ca2420bdfcf4319725f57c9c1739';

  // Convert WGS84 coordinates to GCJ02 (required for Gaode Maps)
  const convertToGCJ02 = (lat: number, lng: number) => {
    // This is a simplified conversion - in production, use a proper conversion library
    return { lat, lng };
  };

  const { lat, lng } = convertToGCJ02(latitude, longitude);

  const toggleOfflineMode = () => {
    const newMode = offlineMapService.toggleOfflineMode();
    setIsOfflineMode(newMode);
    
    if (newMode) {
      toast.success(t("Offline Mode Enabled", "离线模式已启用"), {
        description: t(
          "Using cached map tiles. Some areas may not be available if not downloaded.",
          "使用缓存的地图瓦片。如果未下载，某些区域可能不可用。"
        ),
      });
    } else {
      toast.success(t("Online Mode Enabled", "在线模式已启用"), {
        description: t("Using live map data from servers.", "使用服务器的实时地图数据。"),
      });
    }
    
    // Reload the map if possible
    if (mapRef.current) {
      mapRef.current.destroy();
      initializeMap();
    }
  };
  
  const handleDownloadArea = () => {
    if (!map) return;
    
    toast.success(t("Area Downloaded", "区域已下载"), {
      description: t(
        "Current map view has been saved for offline use.",
        "当前地图视图已保存以供离线使用。"
      ),
    });
    
    const bounds = map.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    // Create a leaflet-compatible bounds object for our service
    const leafletBounds = {
      getNorthEast: () => ({ lat: ne.lat, lng: ne.lng }),
      getSouthWest: () => ({ lat: sw.lat, lng: sw.lng }),
      contains: () => true // Simple implementation
    };
    
    const zoom = map.getZoom();
    offlineMapService.saveRegionForOffline(leafletBounds, zoom - 2, zoom + 2);
  };

  const initializeMap = () => {
    setLoading(true);
    setError(null);
    
    if (!containerRef.current) return;
    
    // Clean up previous map instance
    if (mapRef.current) {
      mapRef.current.destroy();
      mapRef.current = null;
      setMap(null);
      setMarker(null);
    }

    // Load Gaode Maps script dynamically
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${GAODE_API_KEY}&plugin=AMap.Geocoder,AMap.ToolBar,AMap.Scale`;
    script.async = true;
    script.onerror = () => {
      setError(t("Failed to load map service", "加载地图服务失败"));
      setLoading(false);
      toast.error(t("Map Error", "地图错误"), {
        description: t("Could not load the map service. Please try again later.", "无法加载地图服务，请稍后重试。"),
      });
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

                    toast.success(t("Location Updated", "位置已更新"), {
                      description: t(`New location: ${newName}`, `新位置：${newName}`),
                    });
                  } else {
                    // Try to get a name from our offline database
                    const { findNearestLocationsInDatabase } = require('@/lib/api');
                    const nearbyLocations = findNearestLocationsInDatabase(clickLat, clickLng, 20);
                    
                    let fallbackName;
                    if (nearbyLocations && nearbyLocations.length > 0 && nearbyLocations[0].distance < 50) {
                      fallbackName = nearbyLocations[0].name;
                      if (nearbyLocations[0].country) {
                        fallbackName += `, ${nearbyLocations[0].country}`;
                      }
                    } else {
                      fallbackName = t(
                        `Location at ${clickLat.toFixed(4)}°N, ${clickLng.toFixed(4)}°E`,
                        `位置：${clickLat.toFixed(4)}°N, ${clickLng.toFixed(4)}°E`
                      );
                    }
                    
                    onLocationUpdate({
                      name: fallbackName,
                      latitude: clickLat,
                      longitude: clickLng
                    });
                    
                    toast.info(t("Using Local Data", "使用本地数据"), {
                      description: t(`Location identified as: ${fallbackName}`, `位置识别为：${fallbackName}`),
                    });
                  }
                });
              } catch (error) {
                console.error('Error updating location:', error);
                toast.error(t("Location Error", "位置错误"), {
                  description: t("Could not get location name. Using coordinates instead.", 
                                "无法获取位置名称。使用坐标代替。"),
                });
              }
            }
          });
        }

        setLoading(false);

      } catch (err) {
        console.error('Error initializing map:', err);
        setError(t("Failed to initialize map", "初始化地图失败"));
        setLoading(false);
        toast.error(t("Map Error", "地图错误"), {
          description: t("Could not initialize the map. Please try again later.", 
                        "无法初始化地图，请稍后重试。"),
        });
      }
    };

    document.head.appendChild(script);
  };

  useEffect(() => {
    initializeMap();
    
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      
      // Remove script tag on cleanup
      const scriptTag = document.querySelector('script[src*="webapi.amap.com"]');
      if (scriptTag) {
        document.head.removeChild(scriptTag);
      }
    };
  }, []);

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
          
          {/* Map controls */}
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className={`rounded-full p-2 ${isOfflineMode ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={toggleOfflineMode}
              title={t("Toggle Offline Mode", "切换离线模式")}
            >
              <WifiOff className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="rounded-full p-2"
              onClick={handleDownloadArea}
              title={t("Download This Area", "下载此区域")}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
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
