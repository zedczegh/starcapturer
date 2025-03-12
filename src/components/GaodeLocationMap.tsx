
import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import AMapLoader from '@amap/amap-jsapi-loader';
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface GaodeLocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
  onLocationUpdate?: (location: { name: string; latitude: number; longitude: number }) => void;
  editable?: boolean;
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

  // Convert WGS84 coordinates to GCJ02 (required for Gaode Maps)
  const convertToGCJ02 = (lat: number, lng: number) => {
    // Note: In a production environment, you should implement proper coordinate conversion
    // This is a simplified conversion for demo purposes
    return { lat, lng };
  };

  const { lat, lng } = convertToGCJ02(latitude, longitude);

  useEffect(() => {
    if (!containerRef.current || map) return;

    AMapLoader.load({
      key: '2037ca2420bdfcf4319725f57c9c1739', // This is a temporary key for testing. In production, use your own key
      version: '2.0',
      plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.HawkEye', 'AMap.Geocoder']
    })
    .then((AMap) => {
      const newMap = new AMap.Map(containerRef.current, {
        zoom: 13,
        center: [lng, lat],
        resizeEnable: true
      });

      // Add controls
      newMap.addControl(new AMap.ToolBar());
      newMap.addControl(new AMap.Scale());

      // Create marker
      const newMarker = new AMap.Marker({
        position: [lng, lat],
        draggable: editable,
        animation: 'AMAP_ANIMATION_DROP'
      });

      newMarker.setMap(newMap);
      setMap(newMap);
      setMarker(newMarker);

      if (editable) {
        // Handle map clicks for location updates
        newMap.on('click', async (e: any) => {
          const clickLat = e.lnglat.getLat();
          const clickLng = e.lnglat.getLng();
          newMarker.setPosition([clickLng, clickLat]);

          if (onLocationUpdate) {
            try {
              const geocoder = new AMap.Geocoder();
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
              toast.error(t("Location Error", "位置错误"), {
                description: t("Could not get location name. Using coordinates instead.", 
                              "无法获取位置名称。使用坐标代替。"),
              });
            }
          }
        });
      }
    })
    .catch((e) => {
      console.error('Error loading Gaode Maps:', e);
      toast.error(t("Map Error", "地图错误"), {
        description: t("Could not load the map. Please try again later.", 
                      "无法加载地图，请稍后重试。"),
      });
    });

    return () => {
      if (map) {
        map.destroy();
        setMap(null);
        setMarker(null);
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
  }, [latitude, longitude]);

  return (
    <Card>
      <CardContent className="p-0 overflow-hidden rounded-md">
        <div className="aspect-video w-full h-[300px]">
          <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
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
