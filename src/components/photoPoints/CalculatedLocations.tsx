
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useIsMobile } from '@/hooks/use-mobile';
import LocationsGrid from './calculatedLocations/LocationsGrid';
import EmptyCalculatedState from './calculatedLocations/EmptyCalculatedState';
import LoadMoreButtons from './calculatedLocations/LoadMoreButtons';
import { useExpandSearchRadius } from '@/hooks/photoPoints/useExpandSearchRadius';
import { Loader2 } from 'lucide-react';

interface CalculatedLocationsProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh?: () => void;
  searchRadius?: number;
  initialLoad?: boolean;
  onLoadMoreCalculated?: () => void;
  canLoadMoreCalculated?: boolean;
  loadMoreClickCount?: number;
  maxLoadMoreClicks?: number;
}

const CalculatedLocations: React.FC<CalculatedLocationsProps> = ({ 
  locations, 
  loading, 
  hasMore, 
  onLoadMore,
  onRefresh,
  searchRadius = 0,
  initialLoad = false,
  onLoadMoreCalculated,
  canLoadMoreCalculated = false,
  loadMoreClickCount = 0,
  maxLoadMoreClicks = 2
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  // Set up the event listener for expanding search radius
  useExpandSearchRadius({ onRefresh });
  
  // Filter out locations with SIQS score of 0 and water locations
  const validLocations = locations.filter(loc => {
    // Filter out invalid SIQS
    if (loc.siqs === undefined || loc.siqs <= 0) return false;
    
    // Filter out water locations
    const name = loc.name?.toLowerCase() || '';
    const chineseName = loc.chineseName?.toLowerCase() || '';
    const waterTerms = ['water', 'ocean', 'sea', 'lake', '水', '海', '湖', '洋'];
    if (waterTerms.some(term => name.includes(term) || chineseName.includes(term))) {
      return false;
    }
    
    return true;
  });
  
  // Sort locations by distance (closest first)
  const sortedLocations = [...validLocations].sort((a, b) => 
    (a.distance || Infinity) - (b.distance || Infinity)
  );
  
  // Determine if we should show loading state
  if (loading && sortedLocations.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
      </div>
    );
  }
  
  // Show empty state if no locations available
  if (sortedLocations.length === 0) {
    return (
      <EmptyCalculatedState 
        searchRadius={searchRadius}
        onRefresh={onRefresh}
      />
    );
  }
  
  return (
    <>
      <LocationsGrid 
        locations={sortedLocations}
        initialLoad={initialLoad}
        isMobile={isMobile}
      />
      
      <LoadMoreButtons 
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        canLoadMoreCalculated={canLoadMoreCalculated}
        onLoadMoreCalculated={onLoadMoreCalculated}
        loadMoreClickCount={loadMoreClickCount}
        maxLoadMoreClicks={maxLoadMoreClicks}
      />
    </>
  );
};

export default CalculatedLocations;
