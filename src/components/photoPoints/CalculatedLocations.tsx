
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
import { format, addDays } from 'date-fns';

interface CalculatedLocationsProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh?: () => void;
  searchRadius?: number;
  forecastDay?: number;
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
  forecastDay = 0,
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
        isForecast={forecastDay > 0}
      />
    );
  }
  
  const handleViewLocation = (point: SharedAstroSpot) => {
    const locationId = `loc-${point.latitude.toFixed(6)}-${point.longitude.toFixed(6)}`;
    
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
  
  // Generate title based on forecast day
  const getForecastTitle = () => {
    if (forecastDay === 0) return null;
    
    const forecastDate = addDays(new Date(), forecastDay);
    const formattedDate = format(forecastDate, 'yyyy-MM-dd');
    
    return (
      <div className="text-center mb-4">
        <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
          {t("Forecast for", "预测日期：")} {format(forecastDate, 'MMM d, yyyy')}
        </span>
      </div>
    );
  };
  
  return (
    <>
      {getForecastTitle()}
      
      <LocationsGrid 
        locations={sortedLocations}
        initialLoad={initialLoad}
        isMobile={isMobile}
        onViewDetails={handleViewLocation}
        isForecast={forecastDay > 0}
      />
      
      {forecastDay === 0 && (
        <LoadMoreButtons 
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          canLoadMoreCalculated={canLoadMoreCalculated}
          onLoadMoreCalculated={onLoadMoreCalculated}
          loadMoreClickCount={loadMoreClickCount}
          maxLoadMoreClicks={maxLoadMoreClicks}
        />
      )}
    </>
  );
};

export default CalculatedLocations;
