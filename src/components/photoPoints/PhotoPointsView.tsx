import React, { useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointsMap from './map/PhotoPointsMap';
import CalculatedLocations from './CalculatedLocations';
import CertifiedLocations from './CertifiedLocations';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface PhotoPointsViewProps {
  showMap: boolean;
  activeView: 'certified' | 'calculated';
  initialLoad: boolean;
  effectiveLocation: { latitude: number; longitude: number } | null;
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  searchRadius: number;
  calculatedSearchRadius: number;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refreshSiqs?: () => void;
  onLocationClick: (location: SharedAstroSpot) => void;
  onLocationUpdate: (lat: number, lng: number) => void;
  canLoadMoreCalculated?: boolean;
  loadMoreCalculated?: () => void;
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
  canLoadMoreCalculated = false,
  loadMoreCalculated
}) => {
  const { t } = useLanguage();
  const prevActiveViewRef = useRef(activeView);
  const viewTransitionTimeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (prevActiveViewRef.current !== activeView) {
      console.log(`View changed from ${prevActiveViewRef.current} to ${activeView}`);
      prevActiveViewRef.current = activeView;
      
      if (viewTransitionTimeoutRef.current) {
        clearTimeout(viewTransitionTimeoutRef.current);
        viewTransitionTimeoutRef.current = null;
      }
    }
    
    return () => {
      if (viewTransitionTimeoutRef.current) {
        clearTimeout(viewTransitionTimeoutRef.current);
        viewTransitionTimeoutRef.current = null;
      }
    };
  }, [activeView]);
  
  const handleMapLocationUpdate = useCallback((lat: number, lng: number) => {
    try {
      if (!isFinite(lat) || !isFinite(lng)) {
        throw new Error('Invalid coordinates');
      }
      
      const validLat = Math.max(-90, Math.min(90, lat));
      const validLng = Math.max(-180, Math.min(180, lng));
      
      if (validLat !== lat || validLng !== lng) {
        console.warn(`Corrected coordinates from ${lat},${lng} to ${validLat},${validLng}`);
      }
      
      onLocationUpdate(validLat, validLng);
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error(t('Failed to update location', '无法更新位置'));
    }
  }, [onLocationUpdate, t]);

  const handleSafeLocationClick = useCallback((location: SharedAstroSpot) => {
    try {
      if (!location || !location.latitude || !location.longitude) {
        console.warn('Attempted to click invalid location', location);
        return;
      }
      
      onLocationClick(location);
    } catch (error) {
      console.error('Error handling location click:', error);
      toast.error(t('Failed to open location details', '无法打开位置详情'));
    }
  }, [onLocationClick, t]);

  return (
    <div className="mt-4">
      {showMap && (
        <div className="mb-6 relative max-w-xl mx-auto">
          <PhotoPointsMap
            userLocation={effectiveLocation}
            locations={activeView === 'certified' ? certifiedLocations : calculatedLocations}
            onLocationClick={handleSafeLocationClick}
            onLocationUpdate={handleMapLocationUpdate}
            searchRadius={activeView === 'calculated' ? calculatedSearchRadius : searchRadius}
            certifiedLocations={certifiedLocations}
            calculatedLocations={calculatedLocations}
            activeView={activeView}
          />
        </div>
      )}

      {!showMap && activeView === 'certified' && (
        <CertifiedLocations
          locations={certifiedLocations}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onViewDetails={handleSafeLocationClick}
          onRefresh={refreshSiqs}
          initialLoad={initialLoad}
        />
      )}

      {!showMap && activeView === 'calculated' && (
        <CalculatedLocations
          locations={calculatedLocations}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onRefresh={refreshSiqs}
          searchRadius={calculatedSearchRadius}
          initialLoad={initialLoad}
          canLoadMoreCalculated={canLoadMoreCalculated}
          onLoadMoreCalculated={loadMoreCalculated}
        />
      )}
    </div>
  );
};

export default React.memo(PhotoPointsView);
