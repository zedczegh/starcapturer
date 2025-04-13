
import React, { lazy, Suspense } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PageLoader from '@/components/loaders/PageLoader';

const DarkSkyLocations = lazy(() => import('./DarkSkyLocations'));
const CalculatedLocations = lazy(() => import('./CalculatedLocations'));
const PhotoPointsMap = lazy(() => import('./map/PhotoPointsMap'));

interface PhotoPointsContentProps {
  showMap: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  displayRadius: number;
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  filteredCalculatedLocations: SharedAstroSpot[];
  initialLoad: boolean;
  loading: boolean;
  locationLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refreshSiqsData: () => void;
  calculatedSearchRadius: number;
  onLocationClick: (location: SharedAstroSpot) => void;
  onLocationUpdate: (latitude: number, longitude: number) => void;
  canLoadMoreCalculated?: boolean;
  loadMoreCalculatedLocations?: () => void;
  loadMoreClickCount?: number;
  maxLoadMoreClicks?: number;
}

const PhotoPointsContent: React.FC<PhotoPointsContentProps> = ({
  showMap,
  userLocation,
  activeView,
  displayRadius,
  certifiedLocations,
  calculatedLocations,
  filteredCalculatedLocations,
  initialLoad,
  loading,
  locationLoading,
  hasMore,
  loadMore,
  refreshSiqsData,
  calculatedSearchRadius,
  onLocationClick,
  onLocationUpdate,
  canLoadMoreCalculated,
  loadMoreCalculatedLocations,
  loadMoreClickCount,
  maxLoadMoreClicks
}) => {
  // ErrorBoundary wrapper for each lazy-loaded component
  const withErrorBoundary = (Component: React.ReactNode) => (
    <ErrorBoundary fallback={<ErrorFallback />}>
      {Component}
    </ErrorBoundary>
  );
  
  if (showMap) {
    return withErrorBoundary(
      <Suspense fallback={<PageLoader />}>
        <div className="h-auto w-full rounded-lg overflow-hidden border border-border shadow-lg">
          <PhotoPointsMap 
            userLocation={userLocation}
            locations={activeView === 'certified' ? certifiedLocations : calculatedLocations}
            certifiedLocations={certifiedLocations}
            calculatedLocations={calculatedLocations}
            activeView={activeView}
            searchRadius={displayRadius}
            onLocationClick={onLocationClick}
            onLocationUpdate={onLocationUpdate}
          />
        </div>
      </Suspense>
    );
  } else {
    return withErrorBoundary(
      <Suspense fallback={<PageLoader />}>
        <div className="min-h-[300px]">
          {activeView === 'certified' ? (
            <DarkSkyLocations
              locations={certifiedLocations}
              loading={loading && !locationLoading}
              initialLoad={initialLoad}
            />
          ) : (
            <CalculatedLocations
              locations={filteredCalculatedLocations}
              loading={loading && !locationLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onRefresh={refreshSiqsData}
              searchRadius={calculatedSearchRadius}
              initialLoad={initialLoad}
              onLoadMoreCalculated={loadMoreCalculatedLocations}
              canLoadMoreCalculated={canLoadMoreCalculated}
              loadMoreClickCount={loadMoreClickCount}
              maxLoadMoreClicks={maxLoadMoreClicks}
            />
          )}
        </div>
      </Suspense>
    );
  }
};

// Simple ErrorBoundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode, fallback: React.ReactNode}> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    console.error("PhotoPoints component error:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    
    return this.props.children;
  }
}

// Simple error fallback component
const ErrorFallback = () => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <h3 className="text-lg font-medium">Something went wrong loading this content</h3>
    <p className="text-muted-foreground mt-2">Please try refreshing the page</p>
    <button 
      className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
      onClick={() => window.location.reload()}
    >
      Refresh Page
    </button>
  </div>
);

export default PhotoPointsContent;
