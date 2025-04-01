
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, Loader2, RefreshCw, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface PhotoPointsHeaderProps {
  userLocation: { latitude: number; longitude: number } | null;
  locationLoading: boolean;
  locationsLoading: boolean;
  getPosition: () => void;
  refreshData: () => void;
  variants: any;
}

const PhotoPointsHeader: React.FC<PhotoPointsHeaderProps> = ({
  userLocation,
  locationLoading,
  locationsLoading,
  getPosition,
  refreshData,
  variants
}) => {
  const { t } = useLanguage();
  
  return (
    <>
      <motion.div className="flex flex-col items-center text-center mb-8" variants={variants}>
        <h1 className="text-3xl font-bold mb-3 text-gradient">
          {t("Astronomy Photo Points", "天文摄影点")}
        </h1>
        <p className="text-muted-foreground max-w-xl">
          {t(
            "Discover the best locations for astrophotography near you. Filter by certified dark sky areas or algorithmically calculated spots.",
            "发现您附近最佳的天文摄影地点。按认证暗夜区域或算法计算的位置进行筛选。"
          )}
        </p>
      </motion.div>
      
      {/* User location section */}
      {!userLocation && (
        <motion.div className="flex justify-center mb-8" variants={variants}>
          <Button
            onClick={getPosition}
            className="flex items-center gap-2 glassmorphism bg-cosmic-800/30 hover:bg-cosmic-700/40 border border-cosmic-700/30"
            disabled={locationLoading}
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {t("Use My Location", "使用我的位置")}
          </Button>
        </motion.div>
      )}
      
      {/* User location indicator and refresh button */}
      {userLocation && (
        <motion.div 
          className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8"
          variants={variants}
        >
          <div className="flex items-center gap-2 glassmorphism-light px-4 py-2 rounded-lg">
            <Locate className="h-4 w-4 text-blue-400" />
            <span className="text-sm">
              {t(
                `Location: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`,
                `位置: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
              )}
            </span>
          </div>
          
          <Button
            onClick={() => {
              getPosition();
              refreshData();
            }}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 glassmorphism-light hover:bg-cosmic-700/40 border border-cosmic-600/30"
            disabled={locationLoading || locationsLoading}
          >
            <RefreshCw className={`h-4 w-4 ${locationsLoading ? 'animate-spin' : ''}`} />
            {t("Refresh Data", "刷新数据")}
          </Button>
        </motion.div>
      )}
    </>
  );
};

export default PhotoPointsHeader;
