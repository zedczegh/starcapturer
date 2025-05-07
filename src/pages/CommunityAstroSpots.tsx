
import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAstroSpots } from "@/lib/api/fetchCommunityAstroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import PhotoPointsLayout from "@/components/photoPoints/PhotoPointsLayout";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { sortLocationsBySiqs } from "@/utils/siqsHelpers";
import CommunityAstroSpotsHeader from "@/components/community/CommunityAstroSpotsHeader";
import CommunityMap from "@/components/community/CommunityMap";
import CommunityAstroSpotsList from "@/components/community/CommunityAstroSpotsList";
import CommunityLocationsSkeleton from "@/components/community/CommunityLocationsSkeleton";
import CommunityMapContainer from "@/components/community/CommunityMapContainer";

const DEFAULT_CENTER: [number, number] = [30, 104];

const CommunityAstroSpots: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { data: astrospots, isLoading } = useQuery({
    queryKey: ["community-astrospots-supabase"],
    queryFn: fetchCommunityAstroSpots,
    staleTime: 1000 * 60 * 5,
  });

  const [realTimeSiqs, setRealTimeSiqs] = useState<Record<string, number | null>>({});
  const [loadingSiqs, setLoadingSiqs] = useState<Record<string, boolean>>({});
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const handleSiqsCalculated = (spotId: string, siqs: number | null, loading: boolean) => {
    setRealTimeSiqs(prev => ({
      ...prev,
      [spotId]: siqs
    }));
    setLoadingSiqs(prev => ({
      ...prev,
      [spotId]: loading
    }));
  };

  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    console.log("Location updated:", lat, lng);
    setUserLocation([lat, lng]);
  }, []);

  // Sort locations by SIQS scores (highest first)
  const sortedAstroSpots = React.useMemo(() => {
    if (!astrospots) return [];
    
    // Add real-time SIQS values to spots for sorting
    const spotsWithRealtimeSiqs = astrospots.map(spot => ({
      ...spot,
      realTimeSiqs: realTimeSiqs[spot.id] !== undefined ? realTimeSiqs[spot.id] : spot.siqs
    }));
    
    // Sort using the utility function
    return sortLocationsBySiqs(spotsWithRealtimeSiqs);
  }, [astrospots, realTimeSiqs]);

  const handleCardClick = (id: string) => {
    navigate(`/astro-spot/${id}`, { 
      state: { from: 'community' } 
    });
  };

  return (
    <PhotoPointsLayout pageTitle={t("Astrospots Community | SIQS", "观星社区 | SIQS")}>
      <div className="max-w-5xl mx-auto pt-10 px-4 pb-14">
        <CommunityAstroSpotsHeader />

        <CommunityMapContainer>
          {isLoading ? null : (
            <CommunityMap
              center={userLocation || DEFAULT_CENTER}
              locations={sortedAstroSpots ?? []}
              hoveredLocationId={null}
              isMobile={false}
              zoom={userLocation ? 8 : 3}
              onLocationUpdate={handleLocationUpdate}
            />
          )}
        </CommunityMapContainer>

        <h2 className="font-bold text-xl mt-12 mb-5 flex items-center gap-2 text-gradient-blue">
          <span>{t("All Community Astrospots", "全部社区地点")}</span>
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({t("Sorted by best SIQS score", "按照SIQS评分排序")})
          </span>
        </h2>

        {isLoading ? (
          <CommunityLocationsSkeleton />
        ) : (
          <CommunityAstroSpotsList 
            spots={sortedAstroSpots} 
            realTimeSiqs={realTimeSiqs} 
            handleSiqsCalculated={handleSiqsCalculated} 
            handleCardClick={handleCardClick}
          />
        )}
      </div>
    </PhotoPointsLayout>
  );
};

export default CommunityAstroSpots;
