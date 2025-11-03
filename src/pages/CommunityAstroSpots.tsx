
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import PhotoPointsLayout from "@/components/photoPoints/PhotoPointsLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCommunityAstroSpots } from "@/hooks/community/useCommunityAstroSpots";
import { useAnimationVariants } from "@/hooks/community/useAnimationVariants";
import CommunitySpotHeader from "@/components/community/CommunitySpotHeader";
import CommunityMapSection from "@/components/community/CommunityMapSection";
import CommunitySpotsList from "@/components/community/CommunitySpotsList";
import ViewToggle from "@/components/photoPoints/ViewToggle";
import { PhotoPointsViewMode } from "@/components/photoPoints/ViewToggle";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, List, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

// Default map center coordinates
const DEFAULT_CENTER: [number, number] = [30, 104];

const CommunityAstroSpots: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { titleVariants, lineVariants, descVariants } = useAnimationVariants();
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('calculated');
  const [showMap, setShowMap] = useState(true);

  // Use custom hook to handle all data and interactions
  const {
    isLoading,
    sortedAstroSpots,
    realTimeSiqs,
    stabilizedSiqs,
    loadingSiqs,
    userLocation,
    handleSiqsCalculated,
    handleLocationUpdate,
    handleCardClick,
    handleMarkerClick,
    refreshData
  } = useCommunityAstroSpots();

  // Map view modes to spot types
  const viewToSpotType: Record<PhotoPointsViewMode, string | null> = {
    'certified': 'nightscape',
    'calculated': null, // Show all
    'obscura': 'obscura',
    'mountains': 'natural'
  };

  // Filter spots based on active view
  const filteredSpots = React.useMemo(() => {
    if (!sortedAstroSpots) return [];
    const spotType = viewToSpotType[activeView];
    if (!spotType) return sortedAstroSpots; // Show all for 'calculated'
    return sortedAstroSpots.filter(spot => spot.spot_type === spotType);
  }, [sortedAstroSpots, activeView]);
  
  console.log('🏠 Community page debug:', {
    isLoading,
    activeView,
    sortedAstroSpotsLength: sortedAstroSpots?.length || 0,
    filteredSpotsLength: filteredSpots?.length || 0,
    sortedAstroSpots: sortedAstroSpots?.slice(0, 3) || [] // Log first 3 spots
  });

  // Handle refresh when returning from spot profile - without toast
  useEffect(() => {
    const refreshTimestamp = location.state?.refreshTimestamp;
    const forceRefresh = location.state?.forceRefresh;
    const returnedFromSpot = location.state?.returnedFromSpot;
    
    if (refreshTimestamp && (forceRefresh || returnedFromSpot)) {
      console.log("Community page: Forcing data refresh from navigation state");
      refreshData();
    }
  }, [location.state, refreshData]);

  // Auto-toggle to refresh markers when page opens or tab changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Community page visible - auto-toggling to refresh markers');
        // Quick toggle to force marker refresh
        setActiveView(prev => {
          const temp = prev === 'certified' ? 'calculated' : 'certified';
          setTimeout(() => setActiveView(prev), 10);
          return prev;
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <PhotoPointsLayout pageTitle={t("Meteo Spots Community | Meteotinary", "趣小众社区 | 趣小众")}>
      <div className="max-w-5xl mx-auto pt-10 px-4 pb-14">
        {/* Header Section */}
        <CommunitySpotHeader 
          titleVariants={titleVariants} 
          lineVariants={lineVariants} 
          descVariants={descVariants} 
        />

        {/* View Toggle and Map Toggle */}
        <div className="flex justify-between items-center mb-6">
          <ViewToggle 
            activeView={activeView}
            onViewChange={setActiveView}
            loading={isLoading}
            context="community"
          />
          
          <div className="flex items-center">
            {isLoading && (
              <div className="flex items-center text-sm text-muted-foreground mr-4">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                {t("Loading spots...", "正在加载地点...")}
              </div>
            )}
          </div>
          
          <motion.button
            onClick={() => setShowMap(!showMap)}
            className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 hover:from-primary/25 hover:to-accent/25 backdrop-blur-md border border-primary/40 shadow-md transition-all duration-300"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
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
            <motion.div
              initial={false}
              animate={{ rotate: showMap ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {showMap ? (
                <List className="h-5 w-5 text-primary" />
              ) : (
                <MapIcon className="h-5 w-5 text-primary" />
              )}
            </motion.div>
          </motion.button>
        </div>

        {/* Map Section */}
        {showMap && (
          <CommunityMapSection 
            isLoading={isLoading}
            sortedAstroSpots={filteredSpots}
            userLocation={userLocation}
            DEFAULT_CENTER={DEFAULT_CENTER}
            isMobile={isMobile}
            onMarkerClick={handleMarkerClick}
            onLocationUpdate={handleLocationUpdate}
          />
        )}

        {/* Spots List Section */}
        {!showMap && (
          <CommunitySpotsList 
            isLoading={isLoading}
            sortedAstroSpots={filteredSpots}
            isMobile={isMobile}
            onCardClick={handleCardClick}
            realTimeSiqs={realTimeSiqs}
            stabilizedSiqs={stabilizedSiqs}
            loadingSiqs={loadingSiqs}
            onSiqsCalculated={handleSiqsCalculated}
          />
        )}
      </div>
    </PhotoPointsLayout>
  );
};

export default CommunityAstroSpots;
