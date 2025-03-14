
import React, { useCallback, memo, Suspense, lazy } from "react";
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
}

const MapDisplay: React.FC<MapDisplayProps> = ({
  position,
  locationName,
  editable = false,
  onMapReady,
  onMapClick,
  showInfoPanel = false
}) => {
  const { t } = useLanguage();
  
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (editable) {
      onMapClick(lat, lng);
    }
  }, [editable, onMapClick]);

  return (
    <div className="z-0 h-full w-full">
      <Suspense fallback={
        <div className="h-full w-full flex items-center justify-center bg-cosmic-800/20 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 p-4 rounded-lg shadow-lg border border-primary/20 bg-cosmic-900/80">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-primary-foreground/90">{t("Loading map...", "正在加载地图...")}</p>
          </div>
        </div>
      }>
        <LazyMapComponent
          latitude={position[0]}
          longitude={position[1]}
          locationName={locationName}
          isInteractive={editable}
          onMapReady={onMapReady}
          onMapClick={handleMapClick}
          showPopup={showInfoPanel}
        />
      </Suspense>
    </div>
  );
};

export default memo(MapDisplay);
