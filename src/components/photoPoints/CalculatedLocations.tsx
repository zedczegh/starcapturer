
import React from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import LocationsGrid from "./calculatedLocations/LocationsGrid";
import LoadMoreButtons from "./calculatedLocations/LoadMoreButtons";
import EmptyCalculatedState from "./calculatedLocations/EmptyCalculatedState";

// Update the props interface to include all required properties
export interface CalculatedLocationsProps {
  locations: SharedAstroSpot[];
  searchRadius: number;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  loadMoreClickCount?: number;
  maxLoadMoreClicks?: number;
  onLocationClick: (location: SharedAstroSpot) => void;
  userLocation?: { latitude: number; longitude: number };
  initialLoad?: boolean;
  canLoadMoreCalculated?: boolean;
  loadMoreCalculated?: () => void;
}

const CalculatedLocations: React.FC<CalculatedLocationsProps> = ({
  locations,
  searchRadius,
  loading,
  hasMore,
  loadMore,
  loadMoreClickCount = 0,
  maxLoadMoreClicks = 3,
  onLocationClick,
  userLocation,
  initialLoad = false,
  canLoadMoreCalculated = false,
  loadMoreCalculated,
}) => {
  const isMobile = window.innerWidth < 768;
  
  if (!loading && locations.length === 0) {
    return (
      <EmptyCalculatedState 
        searchRadius={searchRadius} 
      />
    );
  }
  
  return (
    <div className="w-full">
      <LocationsGrid 
        locations={locations} 
        initialLoad={initialLoad}
        isMobile={isMobile}
        onViewDetails={onLocationClick} 
      />
      
      {hasMore && !loading && (
        <LoadMoreButtons
          loadMore={loadMore}
          loadMoreClickCount={loadMoreClickCount}
          maxLoadMoreClicks={maxLoadMoreClicks}
          canLoadMoreCalculated={canLoadMoreCalculated}
          loadMoreCalculated={loadMoreCalculated}
        />
      )}
    </div>
  );
};

export default CalculatedLocations;
