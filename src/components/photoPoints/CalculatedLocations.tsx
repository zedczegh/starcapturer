
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
  
  // Filter out locations with SIQS score of 0
  const validLocations = locations.filter(loc => {
    const siqsValue = typeof loc.siqs === 'object' && loc.siqs ? 
      loc.siqs.score : (loc.siqs || 0);
    return siqsValue > 0;
  });
  
  if (loading && validLocations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60 mb-4" />
        <p className="text-center text-sm text-muted-foreground">
          {t("Loading calculated locations...", "正在加载计算位置...")}
        </p>
      </div>
    );
  }
  
  if (!loading && validLocations.length === 0) {
    return <EmptyCalculatedState searchRadius={searchRadius} onRefresh={onRefresh} />;
  }
  
  return (
    <div>
      <LocationsGrid locations={validLocations} />
      
      <LoadMoreButtons 
        loading={loading}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        onLoadMoreCalculated={onLoadMoreCalculated}
        canLoadMoreCalculated={canLoadMoreCalculated}
        loadMoreClickCount={loadMoreClickCount}
        maxLoadMoreClicks={maxLoadMoreClicks}
      />
    </div>
  );
};

export default CalculatedLocations;
