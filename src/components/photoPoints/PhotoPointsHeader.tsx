
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, List, Map, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PhotoPointsHeaderProps {
  userLocation: { latitude: number; longitude: number } | null;
  locationLoading: boolean;
  getPosition: () => void;
  showMapToggle?: boolean;
  showMap?: boolean;
  toggleMapView?: () => void;
  refreshMarkers?: () => void;
  viewToggle?: React.ReactNode;
}

const PhotoPointsHeader: React.FC<PhotoPointsHeaderProps> = ({
  userLocation,
  locationLoading,
  getPosition,
  showMapToggle = false,
  showMap = true,
  toggleMapView,
  refreshMarkers,
  viewToggle
}) => {
  const handleDoubleClick = () => {
    if (refreshMarkers) {
      console.log('🔄 Double-click detected - refreshing markers');
      refreshMarkers();
    }
  };
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
        <div className="flex items-center gap-2">
          {showMapToggle && toggleMapView && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div className="flex items-center">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-xs">
                    {t(
                      "Double-click the toggle button to refresh map markers",
                      "双击切换按钮以刷新地图标记"
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <motion.button
              onClick={toggleMapView}
              onDoubleClick={handleDoubleClick}
              className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 hover:from-primary/25 hover:to-accent/25 backdrop-blur-md border border-primary/40 shadow-md transition-all duration-300"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
            {/* Pulsing animation ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/15"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{
                duration: 2.5,
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
                <List className="h-5 w-5 text-primary" />
              ) : (
                <Map className="h-5 w-5 text-primary" />
              )}
            </motion.div>
          </motion.button>
          </>
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
            "Discover extraordinary locations for night sky photography near you. Switch between categories to explore certified dark sky preserves, calculated optimal spots, mountain peaks, and unique wonders.",
            "发现您附近非凡的夜空摄影地点。在类别之间切换，探索认证暗夜保护区、计算的最佳地点、山峰和独特奇观。"
          )}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default PhotoPointsHeader;
