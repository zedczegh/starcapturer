
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, List, Map, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface PhotoPointsHeaderProps {
  userLocation: { latitude: number; longitude: number } | null;
  locationLoading: boolean;
  getPosition: () => void;
  showMapToggle?: boolean;
  showMap?: boolean;
  toggleMapView?: () => void;
  viewToggle?: React.ReactNode;
}

const PhotoPointsHeader: React.FC<PhotoPointsHeaderProps> = ({
  userLocation,
  locationLoading,
  getPosition,
  showMapToggle = false,
  showMap = true,
  toggleMapView,
  viewToggle
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  const headerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { delay: 0.3, duration: 0.5 }
    }
  };

  const descriptionVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { delay: 0.5, duration: 0.5 }
    }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={headerVariants}
    >
      {/* View Toggle and Map Toggle - Symmetrical Layout */}
      <div className="flex justify-between items-center mb-6">
        {/* Left side - View Toggle */}
        <div className="flex items-center">
          {viewToggle}
        </div>
        
        {/* Center - Loading indicator */}
        <div className="flex items-center">
          {locationLoading && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              {t("Getting location...", "正在获取位置...")}
            </div>
          )}
        </div>
        
        {/* Right side - Map Toggle */}
        <div className="flex items-center">
          {showMapToggle && toggleMapView && (
          <motion.button
            onClick={toggleMapView}
            className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 backdrop-blur-sm border border-primary/30 shadow-lg transition-all duration-300 hover:scale-105"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Pulsing animation ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Icon */}
            <motion.div
              initial={false}
              animate={{ rotate: showMap ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {showMap ? (
                <List className="h-6 w-6 text-primary" />
              ) : (
                <Map className="h-6 w-6 text-primary" />
              )}
            </motion.div>
          </motion.button>
          )}
        </div>
      </div>
      
      <div className="flex flex-col items-center text-center mb-8">
        <motion.h1 
          className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary mb-3`}
          variants={titleVariants}
        >
          {t("New Opportunities", "新机遇")}
        </motion.h1>
        
        {/* Decorative line - similar to AboutHeader */}
        <motion.div
          className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto my-4 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: 80 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        />
        
        <motion.p 
          className="text-muted-foreground max-w-xl mx-auto"
          variants={descriptionVariants}
        >
          {t(
            "Discover the best locations for astrophotography near you. Filter by certified dark sky areas or algorithmically calculated spots.",
            "发现您附近最佳的天文摄影地点。按认证暗夜区域或算法计算的位置进行筛选。"
          )}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default PhotoPointsHeader;
