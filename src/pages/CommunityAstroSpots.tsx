
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

// Default map center coordinates
const DEFAULT_CENTER: [number, number] = [30, 104];

const CommunityAstroSpots: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { titleVariants, lineVariants, descVariants } = useAnimationVariants();
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('calculated');
  const [showMap, setShowMap] = useState(true);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

  // Load user's background image
  useEffect(() => {
    const loadBackground = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('background_image_url')
          .eq('id', user.id)
          .single();
        if (profile?.background_image_url) {
          setBackgroundUrl(profile.background_image_url);
        }
      }
    };
    loadBackground();
  }, []);

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

  // Auto-toggle map on initial load to force proper initialization
  useEffect(() => {
    console.log('🔄 Community page mounted - auto-toggling map for initialization');
    // Double-toggle the map: off then back on
    setShowMap(false);
    setTimeout(() => setShowMap(true), 50);
  }, []);

  // Force marker refresh when activeView changes
  useEffect(() => {
    console.log('🔄 Community page activeView changed, refreshing markers');
    // Force map remount to trigger SIQS recalculation
    setShowMap(false);
    setTimeout(() => setShowMap(true), 50);
  }, [activeView]);
  
  // Auto-toggle to refresh markers when page opens
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Community page visible - refreshing markers');
        // Force map refresh on visibility
        setShowMap(false);
        setTimeout(() => setShowMap(true), 50);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleRefreshMarkers = () => {
    console.log('🔄 Refreshing markers via double-click on community page');
    // Quick toggle to force marker refresh
    const currentView = activeView;
    setActiveView(currentView === 'certified' ? 'calculated' : 'certified');
    setTimeout(() => setActiveView(currentView), 50);
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      {backgroundUrl && (
        <div className="fixed inset-0 z-0">
          <img 
            src={backgroundUrl} 
            alt="Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cosmic-950 via-cosmic-950/30 via-20% to-transparent"></div>
        </div>
      )}
      
      <div className="relative z-10">
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
          
          {isLoading && (
            <div className="flex items-center text-sm text-muted-foreground mr-4">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              {t("Loading spots...", "正在加载地点...")}
            </div>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => setShowMap(!showMap)}
                  onDoubleClick={handleRefreshMarkers}
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
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs">
                  {t(
                    "Double-click to refresh map markers",
                    "双击以刷新地图标记"
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
      </div>
    </div>
  );
};

export default CommunityAstroSpots;
