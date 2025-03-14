
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
          position={position}
          locationName={locationName}
          editable={editable}
          onMapReady={onMapReady}
          onMapClick={onMapClick}
          showInfoPanel={showInfoPanel}
        />
      </Suspense>
    </div>
  );
};

export default memo(MapDisplay);
