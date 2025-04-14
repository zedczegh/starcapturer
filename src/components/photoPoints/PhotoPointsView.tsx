
import React, { useState, useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import PhotoPointsMap from './map/PhotoPointsMap';
import LocationsList from './LocationsList';
import EmptyLocationDisplay from './EmptyLocationDisplay';
import { toast } from 'sonner';

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
  refreshSiqs: () => void;
  onLocationClick: (location: SharedAstroSpot) => void;
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
  loadMoreClickCount = 0,
  maxLoadMoreClicks = 3
}) => {
  const { t } = useLanguage();
  const [isScanning, setIsScanning] = useState(false);
  
  // Track when locations are being loaded
  useEffect(() => {
    setIsScanning(loading);
  }, [loading]);
  
  // Set scanning state when loading more
  const handleLoadMore = () => {
    setIsScanning(true);
    loadMore();
  };
  
  // Set scanning state when loading more calculated locations
  const handleLoadMoreCalculated = () => {
    if (loadMoreCalculated) {
      setIsScanning(true);
      loadMoreCalculated();
    }
  };
  
  // Handle refreshing SIQS data
  const handleRefreshSiqs = () => {
    setIsScanning(true);
    refreshSiqs();
    
    // Show toast notification
    toast.info(t(
      "Refreshing location data...",
      "正在刷新位置数据..."
    ));
    
    // Auto-reset scanning state after a delay
    setTimeout(() => {
      setIsScanning(false);
    }, 5000);
  };
  
  // Reset scanning state when locations change
  useEffect(() => {
    if ((activeView === 'certified' && certifiedLocations.length > 0) || 
        (activeView === 'calculated' && calculatedLocations.length > 0)) {
      setIsScanning(false);
    }
  }, [certifiedLocations, calculatedLocations, activeView]);
  
  // Get current locations based on active view
  const currentLocations = activeView === 'certified' 
    ? certifiedLocations 
    : calculatedLocations;
  
  // If no locations and not loading, show empty state
  if (currentLocations.length === 0 && !loading && !initialLoad) {
    return (
      <EmptyLocationDisplay 
        activeView={activeView}
        onRefresh={handleRefreshSiqs}
      />
    );
  }
  
  return (
    <>
      {showMap ? (
        <PhotoPointsMap
          userLocation={effectiveLocation}
          locations={currentLocations}
          certifiedLocations={certifiedLocations}
          calculatedLocations={calculatedLocations}
          activeView={activeView}
          searchRadius={activeView === 'calculated' ? calculatedSearchRadius : searchRadius}
          onLocationClick={onLocationClick}
          onLocationUpdate={onLocationUpdate}
          isScanning={isScanning}
        />
      ) : (
        <LocationsList
          locations={currentLocations}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onLocationClick={onLocationClick}
          onRefresh={handleRefreshSiqs}
          activeView={activeView}
          canLoadMoreCalculated={canLoadMoreCalculated}
          onLoadMoreCalculated={handleLoadMoreCalculated}
          loadMoreClickCount={loadMoreClickCount}
          maxLoadMoreClicks={maxLoadMoreClicks}
        />
      )}
    </>
  );
};

export default PhotoPointsView;
