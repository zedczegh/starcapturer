
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import EmptyLocationDisplay from '../EmptyLocationDisplay';
import LocationsList from '../LocationsList';
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface LocationViewProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  initialLoad: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

const LocationView: React.FC<LocationViewProps> = ({
  locations,
  loading,
  initialLoad,
  emptyTitle,
  emptyDescription
}) => {
  const { t } = useLanguage();
  const [visibleLocations, setVisibleLocations] = useState<SharedAstroSpot[]>([]);
  const locationsPerPage = 5; // Fixed at 5 locations
  
  // Update visible locations when main locations list changes
  useEffect(() => {
    setVisibleLocations(locations.slice(0, locationsPerPage));
  }, [locations]);
  
  if (loading && initialLoad) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        <p className="text-muted-foreground text-sm">
          {t("Loading locations...", "正在加载地点...")}
        </p>
      </div>
    );
  }
  
  if (locations.length === 0) {
    return (
      <EmptyLocationDisplay 
        title={emptyTitle || t("No locations found", "未找到地点")}
        description={emptyDescription || t(
          "Try adjusting your search criteria.",
          "尝试调整搜索条件。"
        )}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4 flex justify-between items-center">
        <span>
          {t(
            "Showing {{shown}} of {{total}} locations",
            "显示 {{shown}}/{{total}} 个位置"
          )
            .replace('{{shown}}', String(Math.min(locationsPerPage, locations.length)))
            .replace('{{total}}', String(locations.length))}
        </span>
      </div>
      
      <LocationsList 
        locations={visibleLocations}
        loading={loading}
        initialLoad={initialLoad}
        showRealTimeSiqs={true}
      />
      
      {locations.length > locationsPerPage && (
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-full max-w-xs bg-gradient-to-r from-blue-500/10 to-green-500/10 hover:from-blue-500/20 hover:to-green-500/20"
          >
            {t("View More Locations", "查看更多位置")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default LocationView;
