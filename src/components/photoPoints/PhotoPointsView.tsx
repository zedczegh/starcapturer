
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useIsMobile } from '@/hooks/use-mobile';
import PhotoPointsMap from './map/PhotoPointsMap';
import LocationsList from './LocationsList';
import DarkSkyLocations from './DarkSkyLocations';
import CalculatedLocations from './CalculatedLocations';
import EmptyLocationDisplay from './EmptyLocationDisplay';

interface PhotoPointsViewProps {
  showMap: boolean;
  activeView: 'certified' | 'calculated';
  initialLoad: boolean;
  effectiveLocation: { latitude: number; longitude: number } | null;
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  searchRadius: number;
  calculatedSearchRadius?: number;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refreshSiqs?: () => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onLocationUpdate?: (latitude: number, longitude: number) => void;
  canLoadMoreCalculated?: boolean;
  loadMoreCalculated?: () => void;
  loadMoreClickCount?: number;
  maxLoadMoreClicks?: number;
}

const PhotoPointsView: React.FC<PhotoPointsViewProps> = ({
  showMap,
  activeView,
  initialLoad,
  effectiveLocation,
  certifiedLocations,
  calculatedLocations,
  searchRadius,
  calculatedSearchRadius,
  loading,
  hasMore,
  loadMore,
  refreshSiqs,
  onLocationClick,
  onLocationUpdate,
  canLoadMoreCalculated,
  loadMoreCalculated,
  loadMoreClickCount,
  maxLoadMoreClicks,
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  // Map is shown, render the map view
  if (showMap) {
    return (
      <div className={isMobile ? "px-0" : "px-0"}>
        <PhotoPointsMap
          userLocation={effectiveLocation}
          locations={activeView === 'certified' ? certifiedLocations : calculatedLocations}
          certifiedLocations={certifiedLocations}
          calculatedLocations={calculatedLocations}
          activeView={activeView}
          searchRadius={searchRadius}
          onLocationClick={onLocationClick}
          onLocationUpdate={onLocationUpdate}
        />
      </div>
    );
  }
  
  // No map, render the list view based on active view
  return (
    <div className="px-0 sm:px-1">
      {activeView === 'certified' ? (
        <DarkSkyLocations 
          locations={certifiedLocations} 
          loading={loading && initialLoad}
          onLocationClick={onLocationClick}
        />
      ) : (
        <CalculatedLocations 
          userLocation={effectiveLocation}
          locations={calculatedLocations}
          searchRadius={calculatedSearchRadius || 0}
          loading={loading}
          hasMore={canLoadMoreCalculated || false}
          loadMore={loadMoreCalculated || (() => {})}
          loadMoreClickCount={loadMoreClickCount || 0}
          maxLoadMoreClicks={maxLoadMoreClicks || 5}
          onLocationClick={onLocationClick}
        />
      )}
      
      {/* Show Empty state when needed */}
      {!loading && (
        (activeView === 'certified' && certifiedLocations.length === 0) || 
        (activeView === 'calculated' && calculatedLocations.length === 0)
      ) && (
        <EmptyLocationDisplay 
          activeView={activeView}
          userLocation={effectiveLocation}
          onRefresh={refreshSiqs}
        />
      )}
    </div>
  );
};

export default PhotoPointsView;
