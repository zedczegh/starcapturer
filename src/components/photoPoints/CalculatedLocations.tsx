
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useIsMobile } from '@/hooks/use-mobile';
import LocationsGrid from './calculatedLocations/LocationsGrid';
import EmptyCalculatedState from './calculatedLocations/EmptyCalculatedState';
import LoadMoreButtons from './calculatedLocations/LoadMoreButtons';
import { useExpandSearchRadius } from '@/hooks/photoPoints/useExpandSearchRadius';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { isSiqsGreaterThan } from '@/utils/siqsHelpers';
import { calculateAstronomicalNight, formatTime } from '@/utils/astronomy/nightTimeCalculator';

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
  const navigate = useNavigate();
  
  // Set up the event listener for expanding search radius
  useExpandSearchRadius({ onRefresh });
  
  // Filter out locations with SIQS score of 0
  const validLocations = locations.filter(loc => loc.siqs !== undefined && isSiqsGreaterThan(loc.siqs, 0));
  
  // Process locations for astronomical night data
  React.useEffect(() => {
    if (validLocations.length > 0) {
      // Process in batches to avoid blocking UI
      const batchSize = 10;
      let currentBatch = 0;
      
      const processNextBatch = () => {
        const start = currentBatch * batchSize;
        const end = Math.min(start + batchSize, validLocations.length);
        const batch = validLocations.slice(start, end);
        
        batch.forEach(location => {
          if (location.latitude && location.longitude && (!location.metadata || !location.metadata.astronomicalNight)) {
            try {
              const { start, end } = calculateAstronomicalNight(location.latitude, location.longitude);
              const nightTimeStr = formatTime(start) + "-" + formatTime(end);
              
              // Add the data to the location
              location.metadata = location.metadata || {};
              location.metadata.astronomicalNight = {
                start: start.toISOString(),
                end: end.toISOString(),
                formattedTime: nightTimeStr
              };
            } catch (err) {
              console.error("Error calculating astronomical night:", err);
            }
          }
        });
        
        currentBatch++;
        if (currentBatch * batchSize < validLocations.length) {
          setTimeout(processNextBatch, 0);
        }
      };
      
      processNextBatch();
    }
  }, [validLocations]);
  
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
  
  const handleViewLocation = (point: SharedAstroSpot) => {
    const locationId = `loc-${point.latitude.toFixed(6)}-${point.longitude.toFixed(6)}`;
    
    // Make sure we have astronomical night data
    if (point.latitude && point.longitude && (!point.metadata || !point.metadata.astronomicalNight)) {
      try {
        const { start, end } = calculateAstronomicalNight(point.latitude, point.longitude);
        const nightTimeStr = formatTime(start) + "-" + formatTime(end);
        
        // Add the data to the location object
        point.metadata = point.metadata || {};
        point.metadata.astronomicalNight = {
          start: start.toISOString(),
          end: end.toISOString(),
          formattedTime: nightTimeStr
        };
      } catch (err) {
        console.error("Error calculating astronomical night before navigation:", err);
      }
    }
    
    // Navigate to location details page
    navigate(`/location/${locationId}`, {
      state: {
        ...point,
        id: locationId,
        timestamp: new Date().toISOString()
      }
    });
    toast.info(t("Opening location details", "正在打开位置详情"));
  };
  
  return (
    <>
      <LocationsGrid 
        locations={sortedLocations}
        initialLoad={initialLoad}
        isMobile={isMobile}
        onViewDetails={handleViewLocation}
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
