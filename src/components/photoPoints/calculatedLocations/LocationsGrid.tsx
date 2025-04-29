
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoLocationCard from '../PhotoLocationCard';
import { motion } from 'framer-motion';
import { CalendarClock } from 'lucide-react';

interface LocationsGridProps {
  locations: SharedAstroSpot[];
  initialLoad?: boolean;
  isMobile?: boolean;
  onViewDetails: (location: SharedAstroSpot) => void;
  isForecastMode?: boolean;
}

const LocationsGrid: React.FC<LocationsGridProps> = ({
  locations,
  initialLoad = false,
  isMobile = false,
  onViewDetails,
  isForecastMode = false
}) => {
  const staggerDelay = 0.05;
  
  const getForecastBadge = (location: SharedAstroSpot) => {
    if (!isForecastMode || !location.forecastDay) return null;
    
    return (
      <div className="absolute top-2 right-2 bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
        <CalendarClock className="h-3 w-3" />
        <span>Day {location.forecastDay}</span>
      </div>
    );
  };
  
  return (
    <div className={`grid grid-cols-1 ${isMobile ? '' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-4 pb-4`}>
      {locations.map((location, index) => (
        <motion.div
          key={location.id || `loc-${location.latitude}-${location.longitude}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            delay: initialLoad ? staggerDelay * index : 0,
            ease: "easeOut"
          }}
        >
          <div className="relative">
            {getForecastBadge(location)}
            <PhotoLocationCard
              location={location}
              onViewDetails={() => onViewDetails(location)}
              isForecastMode={isForecastMode}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default LocationsGrid;
