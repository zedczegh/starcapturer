
import React, { Suspense } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PageLoader from '@/components/loaders/PageLoader';
import { useLanguage } from '@/contexts/LanguageContext';

const PhotoPointsMap = React.lazy(() => import('@/components/photoPoints/map/PhotoPointsMap'));

interface MapViewProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onLocationClick: (location: SharedAstroSpot) => void;
  onLocationUpdate: (latitude: number, longitude: number) => void;
}

const MapView: React.FC<MapViewProps> = ({
  userLocation,
  locations,
  certifiedLocations,
  calculatedLocations,
  activeView,
  searchRadius,
  onLocationClick,
  onLocationUpdate
}) => {
  const { t } = useLanguage();
  
  return (
    <>
      <div className="mb-4 text-center text-sm text-muted-foreground">
        {t(
          "Click anywhere on the map to select that location. The map will center on your current location if available.",
          "点击地图上的任意位置以选择该位置。如果可用，地图将以您当前位置为中心。"
        )}
      </div>
      
      <Suspense fallback={<PageLoader />}>
        <div className="h-auto w-full rounded-lg overflow-hidden border border-border shadow-lg">
          <PhotoPointsMap 
            userLocation={userLocation}
            locations={locations}
            certifiedLocations={certifiedLocations}
            calculatedLocations={calculatedLocations}
            activeView={activeView}
            searchRadius={searchRadius}
            onLocationClick={onLocationClick}
            onLocationUpdate={onLocationUpdate}
          />
        </div>
      </Suspense>
    </>
  );
};

export default MapView;
