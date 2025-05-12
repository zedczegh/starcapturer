
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoLocationCard from '../PhotoLocationCard';
import { motion } from 'framer-motion';

interface LocationsGridProps {
  locations: SharedAstroSpot[];
  isMobile: boolean;
  initialLoad: boolean;
  onViewDetails: (location: SharedAstroSpot) => void;
}

const LocationsGrid: React.FC<LocationsGridProps> = ({
  locations,
  isMobile,
  initialLoad,
  onViewDetails
}) => {
  const { t } = useLanguage();
  
  const gridClassName = isMobile 
    ? "grid grid-cols-1 gap-4" 
    : "grid grid-cols-1 md:grid-cols-2 gap-4";
  
  return (
    <motion.div 
      className={gridClassName}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {locations.map((location, index) => (
        <motion.div
          key={location.id || `${location.latitude}-${location.longitude}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            delay: Math.min(index * 0.05, 0.5),
            ease: "easeOut" 
          }}
          whileHover={{ 
            scale: 1.02, 
            boxShadow: "0 4px 20px rgba(139, 92, 246, 0.15)"
          }}
          className="transition-all duration-300"
        >
          <PhotoLocationCard
            location={location}
            index={index}
            onViewDetails={() => onViewDetails(location)}
            showRealTimeSiqs={true}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default LocationsGrid;
