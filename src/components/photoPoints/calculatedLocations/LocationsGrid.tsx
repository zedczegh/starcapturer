
import React from 'react';
import { motion } from 'framer-motion';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoLocationCard from '../PhotoLocationCard';

interface LocationsGridProps {
  locations: SharedAstroSpot[];
  initialLoad: boolean;
  isMobile: boolean;
}

const LocationsGrid: React.FC<LocationsGridProps> = ({
  locations,
  initialLoad,
  isMobile
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: isMobile ? 0.05 : 0.1,
        when: "beforeChildren" 
      } 
    }
  };
  
  return (
    <motion.div
      variants={containerVariants}
      initial={initialLoad ? "hidden" : "visible"}
      animate="visible"
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isMobile ? 'content-visibility-auto' : ''}`}
    >
      {locations.map((location, index) => (
        <PhotoLocationCard
          key={location.id || `calc-loc-${index}`}
          location={location}
          index={index}
          showRealTimeSiqs={true}
          isMobile={isMobile}
        />
      ))}
    </motion.div>
  );
};

export default LocationsGrid;
