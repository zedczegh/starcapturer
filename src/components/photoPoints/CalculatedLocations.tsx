
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

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
  error?: Error | null;
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
  error
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
  
  // Show error state if there's an error
  if (error && !loading) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {t(
            "Error loading locations. Please try again.",
            "加载位置时出错。请重试。"
          )}
        </AlertDescription>
      </Alert>
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
    if (!point) return;
    
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
  
  return (
    <>
      <div className="mb-3 text-sm text-muted-foreground text-center">
        {t(
          `Showing ${sortedLocations.length} calculated locations`, 
          `显示 ${sortedLocations.length} 个计算位置`
        )}
      </div>
      
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
        loading={loading}
      />
    </>
  );
};

export default CalculatedLocations;
