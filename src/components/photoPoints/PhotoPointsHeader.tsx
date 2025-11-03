
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
}

const PhotoPointsHeader: React.FC<PhotoPointsHeaderProps> = ({
  userLocation,
  locationLoading,
  getPosition,
  showMapToggle = false,
  showMap = true,
  toggleMapView
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
      {/* Map Toggle and Location Status */}
      <div className="flex justify-end items-center mb-6">
        {/* Show loading indicator when getting location */}
        {locationLoading && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            {t("Getting location...", "正在获取位置...")}
          </div>
        )}
        
        {showMapToggle && toggleMapView && (
          <Button 
            onClick={toggleMapView}
            variant="outline"
            size="sm"
            className="shadow-sm hover:bg-muted/60"
          >
            {showMap ? (
              <><List className="mr-2 h-4 w-4" /> {t("Show List", "显示列表")}</>
            ) : (
              <><Map className="mr-2 h-4 w-4" /> {t("Show Map", "显示地图")}</>
            )}
          </Button>
        )}
      </div>
      
      <div className="flex flex-col items-center text-center mb-8">
        <motion.h1 
          className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary mb-3`}
          variants={titleVariants}
        >
          {t("Stargazing Points", "观星点")}
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
