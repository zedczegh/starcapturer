
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoLocationCard from '../PhotoLocationCard';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileSection from '@/components/ui/mobile-section';

interface LocationsGridProps {
  locations: SharedAstroSpot[];
  initialLoad: boolean;
  onViewDetails: (location: SharedAstroSpot) => void;
}

const LocationsGrid: React.FC<LocationsGridProps> = ({
  locations,
  initialLoad,
  onViewDetails
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  // Mobile-optimized grid layout with borderless frames
  const gridClassName = isMobile 
    ? "grid grid-cols-1 gap-3" 
    : "grid grid-cols-1 md:grid-cols-2 gap-4";
  
  // Reduced animation complexity on mobile for better performance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: isMobile ? 0.2 : 0.3,
        staggerChildren: isMobile ? 0.03 : 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: isMobile ? 10 : 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: isMobile ? 0.25 : 0.4,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <motion.div 
      className={gridClassName}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {locations.map((location, index) => (
        <motion.div
          key={location.id || `${location.latitude}-${location.longitude}`}
          variants={itemVariants}
          whileHover={!isMobile ? {
            scale: 1.02, 
            boxShadow: "0 4px 20px rgba(139, 92, 246, 0.15)"
          } : undefined}
          className="transition-all duration-300"
        >
          <MobileSection 
            padding={isMobile ? "sm" : "md"}
            spacing="none"
            className="h-full hover:bg-cosmic-800/30 border-0"
          >
            <PhotoLocationCard
              location={location}
              index={index}
              onViewDetails={() => onViewDetails(location)}
              showRealTimeSiqs={true}
            />
          </MobileSection>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default LocationsGrid;
