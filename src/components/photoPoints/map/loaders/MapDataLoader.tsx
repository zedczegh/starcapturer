
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MapDataLoaderProps {
  loading: boolean;
  locationCount: number;
  activeView: 'certified' | 'calculated' | 'obscura' | 'mountains';
  searchRadius?: number;
  phase?: 'initial' | 'fetching' | 'processing' | 'ready' | 'changing_location';
}

/**
 * Animated loader component for map data loading states
 * Shows different messages based on loading phases
 */
const MapDataLoader: React.FC<MapDataLoaderProps> = ({ 
  loading, 
  locationCount, 
  activeView,
  searchRadius = 0,
  phase = 'initial'
}) => {
  const { t } = useLanguage();
  const [showLoader, setShowLoader] = useState(loading);
  const [loadingPhase, setLoadingPhase] = useState<string>(phase);
  
  // Determine loading message based on phase
  const getLoadingMessage = () => {
    switch (loadingPhase) {
      case 'initial':
        return t("Initializing map...", "正在初始化地图...");
      case 'fetching':
        return activeView === 'certified' 
          ? t("Finding certified dark sky locations...", "正在查找认证的黑暗天空地点...")
          : t(`Calculating best spots within ${searchRadius}km...`, `正在计算${searchRadius}公里范围内的最佳地点...`);
      case 'processing':
        return activeView === 'certified'
          ? t("Processing certified locations...", "正在处理认证地点...")
          : t("Processing stored & new calculated locations...", "正在处理存储和新计算的地点...");
      case 'changing_location':
        return t("Updating for new position...", "正在为新位置更新...");
      case 'ready':
        return locationCount > 0 
          ? activeView === 'certified' 
            ? t(`Loaded ${locationCount} certified locations`, `已加载${locationCount}个认证位置`) 
            : t(`Loaded ${locationCount} locations`, `已加载${locationCount}个位置`) 
          : t("No locations found", "未找到位置");
      default:
        return t("Loading map data...", "正在加载地图数据...");
    }
  };
  
  // Update loading phase based on props
  useEffect(() => {
    if (loading) {
      if (phase) {
        setLoadingPhase(phase);
      } else if (locationCount === 0) {
        setLoadingPhase('fetching');
      } else {
        setLoadingPhase('processing');
      }
      setShowLoader(true);
    } else {
      setLoadingPhase('ready');
      
      // Hide loader after a delay when loading completes
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [loading, locationCount, phase]);
  
  return (
    <AnimatePresence>
      {showLoader && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-background/80 backdrop-blur-sm 
                     px-4 py-2 rounded-full shadow-md border border-border flex items-center gap-2"
        >
          {loading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-4 w-4 text-primary" />
            </motion.div>
          )}
          <motion.span 
            className="text-sm font-medium"
            animate={{ opacity: loading ? [0.8, 1, 0.8] : 1 }}
            transition={{ duration: 1.5, repeat: loading ? Infinity : 0 }}
          >
            {getLoadingMessage()}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MapDataLoader;
