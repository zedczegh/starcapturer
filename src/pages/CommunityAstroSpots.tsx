
import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import PhotoPointsLayout from "@/components/photoPoints/PhotoPointsLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCommunityAstroSpots } from "@/hooks/community/useCommunityAstroSpots";
import { useAnimationVariants } from "@/hooks/community/useAnimationVariants";
import CommunitySpotHeader from "@/components/community/CommunitySpotHeader";
import CommunityMapSection from "@/components/community/CommunityMapSection";
import CommunitySpotsList from "@/components/community/CommunitySpotsList";
import CommunityFilters, { CommunityFiltersState } from "@/components/community/CommunityFilters";

// Default map center coordinates
const DEFAULT_CENTER: [number, number] = [30, 104];

const CommunityAstroSpots: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { titleVariants, lineVariants, descVariants } = useAnimationVariants();
  
  // Filters state
  const [filters, setFilters] = useState<CommunityFiltersState>({
    bookingAvailable: false,
    verificationPending: false
  });

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
  
  // Filter spots based on active filters
  const filteredAstroSpots = useMemo(() => {
    if (!sortedAstroSpots) return [];
    
    console.log('🔍 Filtering with:', filters);
    console.log('📊 Total spots:', sortedAstroSpots.length);
    
    const filtered = sortedAstroSpots.filter(spot => {
      console.log('🏠 Checking spot:', spot.name, {
        availableBookings: spot.availableBookings,
        verification_status: spot.verification_status
      });
      
      // Booking availability filter
      if (filters.bookingAvailable) {
        const hasBookings = spot.availableBookings && spot.availableBookings > 0;
        console.log(`✅ Booking filter: ${hasBookings}`);
        return hasBookings;
      }
      
      // Verification pending filter
      if (filters.verificationPending) {
        const isPending = spot.verification_status === 'pending';
        console.log(`⏳ Verification filter: ${isPending}`);
        return isPending;
      }
      
      // No filters active, show all
      return true;
    });
    
    console.log('🎯 Filtered results:', filtered.length);
    return filtered;
  }, [sortedAstroSpots, filters]);
  
  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(Boolean).length;
  }, [filters]);
  
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
          sortedAstroSpots={filteredAstroSpots}
          userLocation={userLocation}
          DEFAULT_CENTER={DEFAULT_CENTER}
          isMobile={isMobile}
          onMarkerClick={handleMarkerClick}
          onLocationUpdate={handleLocationUpdate}
        />

        {/* Filters Section */}
        <CommunityFilters
          filters={filters}
          onFiltersChange={setFilters}
          activeFiltersCount={activeFiltersCount}
        />

        {/* Spots List Section */}
        <CommunitySpotsList 
          isLoading={isLoading}
          sortedAstroSpots={filteredAstroSpots}
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
