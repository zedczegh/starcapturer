
import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAstroSpots } from "@/lib/api/fetchCommunityAstroSpots";
import PhotoPointsLayout from "@/components/photoPoints/PhotoPointsLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { sortLocationsBySiqs } from "@/utils/siqsHelpers";
import CommunityHeader from "@/components/community/CommunityHeader";
import CommunityMapSection from "@/components/community/CommunityMapSection";
import CommunityLocationsList from "@/components/community/CommunityLocationsList";

const DEFAULT_CENTER: [number, number] = [30, 104];

const CommunityAstroSpots: React.FC = () => {
  const { t } = useLanguage();

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

  return (
    <PhotoPointsLayout pageTitle={t("Astrospots Community | SIQS", "观星社区 | SIQS")}>
      <div className="max-w-5xl mx-auto pt-10 px-4 pb-14">
        <CommunityHeader />

        <CommunityMapSection 
          isLoading={isLoading}
          sortedAstroSpots={sortedAstroSpots}
          userLocation={userLocation}
          defaultCenter={DEFAULT_CENTER}
          onLocationUpdate={handleLocationUpdate}
        />

        <CommunityLocationsList 
          isLoading={isLoading}
          sortedAstroSpots={sortedAstroSpots}
          realTimeSiqs={realTimeSiqs}
          onSiqsCalculated={handleSiqsCalculated}
        />
      </div>
    </PhotoPointsLayout>
  );
};

export default CommunityAstroSpots;
