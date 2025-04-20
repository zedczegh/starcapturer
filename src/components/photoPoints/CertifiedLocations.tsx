
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import PhotoPointCard from './PhotoPointCard';

interface CertifiedLocationsProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onViewDetails: (location: SharedAstroSpot) => void;
  onRefresh?: () => void;
  initialLoad: boolean;
}

const CertifiedLocations: React.FC<CertifiedLocationsProps> = ({
  locations,
  loading,
  hasMore,
  onLoadMore,
  onViewDetails,
  onRefresh,
  initialLoad
}) => {
  const { t } = useLanguage();

  if (loading && locations.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {t("No certified dark sky locations found in this area.", "在此区域中未找到认证的暗空地点。")}
        </p>
        {onRefresh && (
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={onRefresh}
          >
            {t("Refresh Locations", "刷新位置")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {locations.slice(0, 5).map((location, index) => (
        <PhotoPointCard
          key={`${location.id || location.latitude}-${location.longitude}`}
          point={location}
          onViewDetails={() => onViewDetails(location)}
          userLocation={null}
        />
      ))}
      
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Loading...", "加载中...")}
              </>
            ) : (
              t("Load More", "加载更多")
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CertifiedLocations;
