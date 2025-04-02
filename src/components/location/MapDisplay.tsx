
import React, { useCallback, memo, Suspense, lazy, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";

// Lazy load the Leaflet map components to improve initial page load
const LazyMapComponent = lazy(() => import('./map/LazyMapComponent'));

interface MapDisplayProps {
  position: [number, number];
  locationName: string;
  editable?: boolean;
  onMapReady: () => void;
  onMapClick: (lat: number, lng: number) => void;
  showInfoPanel?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
}

const MapDisplay: React.FC<MapDisplayProps> = ({
  position,
  locationName,
  editable = false,
  onMapReady,
  onMapClick,
  showInfoPanel = false,
  isDarkSkyReserve = false,
  certification = ''
}) => {
  const { t } = useLanguage();

  // Memoize position to prevent unnecessary rerenders
  const memoizedPosition = useMemo(() => position, [position[0], position[1]]);
  
  // Format location name for display
  const displayName = useMemo(() => {
    // If the name is too long, truncate it for the map display
    if (locationName && locationName.length > 50) {
      return locationName.substring(0, 47) + '...';
    }
    return locationName;
  }, [locationName]);

  return (
    <div className="z-0 h-full w-full">
      <Suspense fallback={
        <div className="h-full w-full flex items-center justify-center bg-cosmic-800/20">
          <div className="flex flex-col items-center gap-3">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-primary-foreground/90">{t("Loading map...", "正在加载地图...")}</p>
          </div>
        </div>
      }>
        <LazyMapComponent
          position={memoizedPosition}
          locationName={displayName}
          editable={editable}
          onMapReady={onMapReady}
          onMapClick={onMapClick}
          showInfoPanel={showInfoPanel}
          isDarkSkyReserve={isDarkSkyReserve}
          certification={certification}
        />
      </Suspense>
    </div>
  );
};

export default memo(MapDisplay);
