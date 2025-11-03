
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
import SpotTypeFilter, { SpotType } from "@/components/community/SpotTypeFilter";
import { useState } from "react";

// Default map center coordinates
const DEFAULT_CENTER: [number, number] = [30, 104];

const CommunityAstroSpots: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { titleVariants, lineVariants, descVariants } = useAnimationVariants();
  const [activeSpotType, setActiveSpotType] = useState<SpotType>('all');

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

  // Filter spots based on active spot type
  const filteredSpots = React.useMemo(() => {
    if (!sortedAstroSpots) return [];
    if (activeSpotType === 'all') return sortedAstroSpots;
    return sortedAstroSpots.filter(spot => spot.spot_type === activeSpotType);
  }, [sortedAstroSpots, activeSpotType]);
  
  console.log('🏠 Community page debug:', {
    isLoading,
    activeSpotType,
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

  return (
    <PhotoPointsLayout pageTitle={t("Meteo Spots Community | Meteotinary", "气象点社区 | Meteotinary")}>
      <div className="max-w-5xl mx-auto pt-10 px-4 pb-14">
        {/* Header Section */}
        <CommunitySpotHeader 
          titleVariants={titleVariants} 
          lineVariants={lineVariants} 
          descVariants={descVariants} 
        />

        {/* Spot Type Filter */}
        <SpotTypeFilter 
          activeType={activeSpotType}
          onTypeChange={setActiveSpotType}
        />

        {/* Map Section */}
        <CommunityMapSection 
          isLoading={isLoading}
          sortedAstroSpots={filteredSpots}
          userLocation={userLocation}
          DEFAULT_CENTER={DEFAULT_CENTER}
          isMobile={isMobile}
          onMarkerClick={handleMarkerClick}
          onLocationUpdate={handleLocationUpdate}
        />

        {/* Spots List Section */}
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
      </div>
    </PhotoPointsLayout>
  );
};

export default CommunityAstroSpots;
