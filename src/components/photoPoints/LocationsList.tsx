import React, { useState, useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoLocationCard from './PhotoLocationCard';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface LocationsListProps {
  locations: SharedAstroSpot[];
  loading: boolean;
  initialLoad: boolean;
  onViewDetails?: (point: SharedAstroSpot) => void;
  showRealTimeSiqs?: boolean;
}

const LocationsList: React.FC<LocationsListProps> = ({
  locations,
  loading,
  initialLoad,
  onViewDetails,
  showRealTimeSiqs = false
}) => {
  const { t } = useLanguage();
  const [visibleLocations, setVisibleLocations] = useState<SharedAstroSpot[]>([]);
  const [page, setPage] = useState(1);
  const locationsPerPage = 5;
  
  useEffect(() => {
    if (locations.length > 0) {
      setVisibleLocations([...locations.slice(0, page * locationsPerPage)]);
    } else {
      setVisibleLocations([]);
    }
  }, [locations, page]);
  
  useEffect(() => {
    setPage(1);
  }, [locations.length]); 
  
  const loadMore = () => {
    setPage(prevPage => prevPage + 1);
  };
  
  const hasMoreToLoad = visibleLocations.length < locations.length;
  
  if (locations.length === 0 && !loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("No locations found matching your criteria.", "未找到符合条件的位置。")}
      </div>
    );
  }
  
  return (
    <div className="space-y-4 pb-8">
      <div className="grid grid-cols-1 gap-4">
        {visibleLocations.map((location, index) => (
          <motion.div
            key={location.id || `${location.latitude}-${location.longitude}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            layout
          >
            <PhotoLocationCard
              location={location}
              index={index}
              onViewDetails={onViewDetails || (() => {})}
              showRealTimeSiqs={true} // Always fetch real-time SIQS
            />
          </motion.div>
        ))}
      </div>

      {loading && !initialLoad && (
        <div className="flex justify-center pt-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
        </div>
      )}
      
      {hasMoreToLoad && !loading && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={loadMore}
            className="border-cosmic-600/30 hover:bg-cosmic-800/50"
          >
            {t("Load More", "加载更多")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default LocationsList;
