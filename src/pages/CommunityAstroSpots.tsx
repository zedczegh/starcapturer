
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
import { toast } from "sonner";

// Default map center coordinates
const DEFAULT_CENTER: [number, number] = [30, 104];

const CommunityAstroSpots: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { titleVariants, lineVariants, descVariants } = useAnimationVariants();

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
  
  // Handle refresh when returning from spot profile
  useEffect(() => {
    const refreshTimestamp = location.state?.refreshTimestamp;
    const forceRefresh = location.state?.forceRefresh;
    const returnedFromSpot = location.state?.returnedFromSpot;
    
    if (refreshTimestamp && (forceRefresh || returnedFromSpot)) {
      console.log("Community page: Forcing data refresh from navigation state");
      refreshData();
      
      // Show a toast for improved UX
      if (!isMobile) {
        toast.info("Community data refreshed");
      }
    }
  }, [location.state, refreshData, isMobile]);

  return (
    <PhotoPointsLayout pageTitle={t("Astrospots Community | SIQS", "观星社区 | SIQS")}>
      <div className="max-w-5xl mx-auto pt-10 px-4 pb-14">
        {/* Header Section */}
        <CommunitySpotHeader 
          titleVariants={titleVariants} 
          lineVariants={lineVariants} 
          descVariants={descVariants} 
        />

        {/* Map Section */}
        <CommunityMapSection 
          isLoading={isLoading}
          sortedAstroSpots={sortedAstroSpots}
          userLocation={userLocation}
          DEFAULT_CENTER={DEFAULT_CENTER}
          isMobile={isMobile}
          onMarkerClick={handleMarkerClick}
          onLocationUpdate={handleLocationUpdate}
        />

        {/* Spots List Section */}
        <CommunitySpotsList 
          isLoading={isLoading}
          sortedAstroSpots={sortedAstroSpots}
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
