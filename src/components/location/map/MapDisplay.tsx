
import React, { useCallback, memo, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader } from "lucide-react";
import LazyMapComponent from './LazyMapComponent';

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

  // Memoized callback for map ready
  const handleMapReady = useCallback(() => {
    onMapReady();
  }, [onMapReady]);

  return (
    <div className="z-0 h-full w-full">
      <LazyMapComponent
        position={memoizedPosition}
        locationName={displayName}
        editable={editable}
        onMapReady={handleMapReady}
        onMapClick={onMapClick}
        showInfoPanel={showInfoPanel}
        isDarkSkyReserve={isDarkSkyReserve}
        certification={certification}
      />
    </div>
  );
};

export default memo(MapDisplay);
