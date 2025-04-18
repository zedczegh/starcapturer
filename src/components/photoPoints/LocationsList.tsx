
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoLocationCard from './PhotoLocationCard';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
        {locations.map((location, index) => (
          <motion.div
            key={location.id || `${location.latitude}-${location.longitude}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <PhotoLocationCard
              location={location}
              index={index}
              onViewDetails={onViewDetails || (() => {})}
              showRealTimeSiqs={showRealTimeSiqs}
            />
          </motion.div>
        ))}
      </div>

      {loading && !initialLoad && (
        <div className="flex justify-center pt-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
        </div>
      )}
    </div>
  );
};

export default LocationsList;
