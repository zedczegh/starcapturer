
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLocations, setTotalLocations] = useState(0);
  const locationsPerPage = 5; // Fixed at 5 locations per page
  
  useEffect(() => {
    console.log(`LocationView received ${locations.length} locations`);
    setTotalLocations(locations.length);
    setCurrentPage(1);
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
    // Use the onRefresh function that's required by EmptyLocationDisplay
    const dummyRefresh = () => console.log("Refresh requested but not implemented");
    
    return (
      <EmptyLocationDisplay 
        title={emptyTitle || t("No locations found", "未找到地点")}
        description={emptyDescription || t(
          "Try adjusting your search criteria.",
          "尝试调整搜索条件。"
        )}
        onRefresh={dummyRefresh} // Add required onRefresh prop with dummy function
      />
    );
  }
  
  // Calculate pagination values
  const indexOfLastLocation = currentPage * locationsPerPage;
  const indexOfFirstLocation = indexOfLastLocation - locationsPerPage;
  
  // Get current page locations
  const currentLocations = locations.slice(0, indexOfLastLocation);
  
  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
  };
  
  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4 flex flex-wrap justify-between items-center">
        <span>
          {t(
            "Showing {{start}}-{{end}} of {{total}} locations",
            "显示 {{start}}-{{end}}，共 {{total}} 个位置"
          )
            .replace('{{start}}', String(1))
            .replace('{{end}}', String(Math.min(indexOfLastLocation, locations.length)))
            .replace('{{total}}', String(totalLocations))}
        </span>
      </div>
      
      <LocationsList 
        locations={currentLocations}
        loading={loading}
        initialLoad={initialLoad}
        showRealTimeSiqs={true}
      />
      
      {indexOfLastLocation < locations.length && (
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline"
            onClick={loadMore}
            className="w-full max-w-xs"
          >
            {t("Load More Locations", "加载更多位置")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default LocationView;
